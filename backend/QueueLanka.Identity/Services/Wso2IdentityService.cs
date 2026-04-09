using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using QueueLanka.Shared.Exceptions;

namespace QueueLanka.Identity.Services;

/// <summary>
/// Integrates with WSO2 Identity Server via:
///  - OIDC/OAuth2 Token endpoint (ROPC grant) for authentication
///  - SCIM2 REST API for user provisioning on registration
/// </summary>
public sealed class Wso2IdentityService : IWso2IdentityService
{
    private readonly HttpClient     _http;
    private readonly IConfiguration _config;
    private readonly ILogger<Wso2IdentityService> _logger;

    // Config keys
    private string BaseUrl       => _config["Wso2:BaseUrl"]?.TrimEnd('/') ?? throw new InvalidOperationException("Wso2:BaseUrl is not configured.");
    private string ClientId      => _config["Wso2:ClientId"]              ?? throw new InvalidOperationException("Wso2:ClientId is not configured.");
    private string ClientSecret  => _config["Wso2:ClientSecret"]          ?? throw new InvalidOperationException("Wso2:ClientSecret is not configured.");
    private string AdminUsername => _config["Wso2:AdminUsername"]         ?? "admin";
    private string AdminPassword => _config["Wso2:AdminPassword"]         ?? throw new InvalidOperationException("Wso2:AdminPassword is not configured.");

    private static readonly JsonSerializerOptions _jsonOpts = new()
    {
        PropertyNamingPolicy        = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition      = JsonIgnoreCondition.WhenWritingNull,
        PropertyNameCaseInsensitive = true
    };

    public Wso2IdentityService(HttpClient http, IConfiguration config, ILogger<Wso2IdentityService> logger)
    {
        _http   = http;
        _config = config;
        _logger = logger;
    }

    // ── ROPC Token Exchange ──────────────────────────────────────────────────

    /// <inheritdoc/>
    public async Task<Wso2TokenResult> GetTokenAsync(string username, string password, CancellationToken ct = default)
    {
        var tokenEndpoint = $"{BaseUrl}/oauth2/token";

        var body = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "password",
            ["username"]   = username,
            ["password"]   = password,
            ["scope"]      = "openid profile",
            ["client_id"]     = ClientId,
            ["client_secret"] = ClientSecret
        });

        HttpResponseMessage response;
        try
        {
            response = await _http.PostAsync(tokenEndpoint, body, ct);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "WSO2 IS token endpoint unreachable at {Endpoint}", tokenEndpoint);
            throw new AppException(503, "WSO2_UNAVAILABLE", "Identity server is temporarily unavailable. Please try again later.");
        }

        if (response.StatusCode == HttpStatusCode.Unauthorized || response.StatusCode == HttpStatusCode.BadRequest)
        {
            // WSO2 IS returns 400 for invalid credentials in ROPC
            _logger.LogWarning("WSO2 ROPC rejected credentials for user {Username} — HTTP {Status}", username, response.StatusCode);
            throw new InvalidCredentialsException();
        }

        if (!response.IsSuccessStatusCode)
        {
            var errBody = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError("WSO2 token endpoint returned {Status}: {Body}", response.StatusCode, errBody);
            throw new AppException(502, "WSO2_ERROR", "An error occurred with the identity provider.");
        }

        var tokenResponse = await response.Content.ReadFromJsonAsync<Wso2TokenResponse>(_jsonOpts, ct)
            ?? throw new AppException(502, "WSO2_PARSE_ERROR", "Failed to parse identity server response.");

        return new Wso2TokenResult(
            AccessToken:  tokenResponse.AccessToken,
            RefreshToken: tokenResponse.RefreshToken ?? string.Empty,
            ExpiresIn:    tokenResponse.ExpiresIn,
            Scope:        tokenResponse.Scope ?? string.Empty);
    }

    // ── SCIM2 User Provisioning ──────────────────────────────────────────────

    /// <inheritdoc/>
    public async Task ProvisionUserAsync(string username, string password, string email, string role, int? centerId = null, CancellationToken ct = default)
    {
        var scim2Endpoint = $"{BaseUrl}/scim2/Users";

        // Build SCIM2 user resource as a dictionary so we can use a dynamic schema key
        var scimUser = new Dictionary<string, object?>
        {
            ["schemas"]  = new[] { "urn:ietf:params:scim:schemas:core:2.0:User" },
            ["userName"] = username,
            ["password"] = password,
            ["emails"]   = new[] { new { value = email, primary = true } },
            // WSO2 IS uses the "groups" attribute for role assignment.
            // Groups matching the app role names (citizen/officer/admin) must exist in WSO2 IS.
            ["groups"]   = new[] { new { display = role, value = role } }
        };

        // Add centerId as a custom WSO2 extension attribute (only for officers).
        // Requires a custom user attribute "centerId" defined in WSO2 IS.
        // If the attribute is not configured, WSO2 IS will silently ignore it.
        if (centerId.HasValue)
        {
            scimUser["urn:scim:wso2:qlanka:1.0"] = new { centerId = centerId.Value.ToString() };
        }

        var adminCredentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{AdminUsername}:{AdminPassword}"));

        var jsonContent = new StringContent(
            JsonSerializer.Serialize(scimUser, _jsonOpts),
            Encoding.UTF8,
            "application/json");

        HttpResponseMessage response;
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Post, scim2Endpoint)
            {
                Content = jsonContent
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Basic", adminCredentials);
            response = await _http.SendAsync(request, ct);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "WSO2 IS SCIM2 endpoint unreachable at {Endpoint}", scim2Endpoint);
            // Don't block registration if WSO2 IS is temporarily down — log and continue
            _logger.LogWarning("User {Username} created in MySQL but WSO2 provisioning failed. Manual sync required.", username);
            return;
        }

        if (response.StatusCode == HttpStatusCode.Conflict)
        {
            // User already exists in WSO2 IS (e.g., partial previous attempt)
            _logger.LogWarning("WSO2 IS: User {Username} already exists — skipping SCIM2 creation.", username);
            return;
        }

        if (!response.IsSuccessStatusCode)
        {
            var errBody = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError("WSO2 SCIM2 provisioning failed for {Username} — HTTP {Status}: {Body}",
                username, response.StatusCode, errBody);
            // Non-fatal: user is created in MySQL; WSO2 sync failure is logged
            // Operators should use manual SCIM2 sync if needed
        }
        else
        {
            _logger.LogInformation("WSO2 IS: User {Username} provisioned successfully with role {Role}.", username, role);
        }
    }

    // ── Private DTOs ──────────────────────────────────────────────────────────

    private sealed class Wso2TokenResponse
    {
        [JsonPropertyName("access_token")]
        public string AccessToken { get; set; } = string.Empty;

        [JsonPropertyName("refresh_token")]
        public string? RefreshToken { get; set; }

        [JsonPropertyName("expires_in")]
        public int ExpiresIn { get; set; }

        [JsonPropertyName("scope")]
        public string? Scope { get; set; }

        [JsonPropertyName("token_type")]
        public string? TokenType { get; set; }
    }
}
