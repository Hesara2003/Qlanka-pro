using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using QueueLanka.Shared.Exceptions;

namespace QueueLanka.Identity.Services;

public sealed class Wso2IdentityService : IWso2IdentityService
{
    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly ILogger<Wso2IdentityService> _logger;

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public Wso2IdentityService(HttpClient http, IConfiguration config, ILogger<Wso2IdentityService> logger)
    {
        _http = http;
        _config = config;
        _logger = logger;
    }

    public async Task<Wso2TokenResult> RequestTokenAsync(string username, string password, CancellationToken ct = default)
    {
        var tokenEndpoint = BuildEndpoint("/oauth2/token");
        var clientId = _config["Wso2:ClientId"];
        var clientSecret = _config["Wso2:ClientSecret"];

        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret))
        {
            throw new AppException(500, "WSO2_CONFIG_INVALID", "WSO2 client credentials are not configured.");
        }

        using var body = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"] = "password",
            ["username"] = username,
            ["password"] = password,
            ["scope"] = "openid profile",
            ["client_id"] = clientId,
            ["client_secret"] = clientSecret
        });

        HttpResponseMessage response;
        try
        {
            response = await _http.PostAsync(tokenEndpoint, body, ct);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "WSO2 token endpoint unreachable at {Endpoint}", tokenEndpoint);
            throw new AppException(503, "WSO2_UNAVAILABLE", "Identity server is temporarily unavailable. Please try again later.");
        }

        if (response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.Unauthorized)
        {
            throw new InvalidCredentialsException();
        }

        if (!response.IsSuccessStatusCode)
        {
            var errBody = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError("WSO2 token endpoint returned {StatusCode}: {ResponseBody}", response.StatusCode, errBody);
            throw new AppException(502, "WSO2_TOKEN_ERROR", "An error occurred with the identity provider.");
        }

        var payload = await response.Content.ReadFromJsonAsync<Wso2TokenResponse>(JsonOptions, ct);
        if (payload is null || string.IsNullOrWhiteSpace(payload.AccessToken))
        {
            throw new AppException(502, "WSO2_TOKEN_PARSE_ERROR", "Failed to parse token response from identity provider.");
        }

        return new Wso2TokenResult(
            payload.AccessToken,
            payload.RefreshToken ?? string.Empty,
            payload.ExpiresIn);
    }

    public async Task ProvisionUserAsync(string username, string password, string email, string role, int? centerId, CancellationToken ct = default)
    {
        var scimEndpoint = BuildEndpoint("/scim2/Users");
        var adminUsername = _config["Wso2:AdminUsername"];
        var adminPassword = _config["Wso2:AdminPassword"];

        if (string.IsNullOrWhiteSpace(adminUsername) || string.IsNullOrWhiteSpace(adminPassword))
        {
            throw new AppException(500, "WSO2_CONFIG_INVALID", "WSO2 SCIM admin credentials are not configured.");
        }

        var scimPayload = new Dictionary<string, object?>
        {
            ["schemas"] = new[] { "urn:ietf:params:scim:schemas:core:2.0:User" },
            ["userName"] = username,
            ["password"] = password,
            ["emails"] = new[] { new { value = email, primary = true } },
            ["groups"] = new[] { new { display = role, value = role } }
        };

        if (centerId.HasValue)
        {
            scimPayload["urn:scim:wso2:qlanka:1.0"] = new { centerId = centerId.Value.ToString() };
        }

        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{adminUsername}:{adminPassword}"));

        using var request = new HttpRequestMessage(HttpMethod.Post, scimEndpoint)
        {
            Content = new StringContent(JsonSerializer.Serialize(scimPayload, JsonOptions), Encoding.UTF8, "application/json")
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);

        HttpResponseMessage response;
        try
        {
            response = await _http.SendAsync(request, ct);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "WSO2 SCIM endpoint unreachable at {Endpoint}", scimEndpoint);
            throw new AppException(503, "WSO2_UNAVAILABLE", "Identity server is temporarily unavailable. Please try again later.");
        }

        if (response.StatusCode == HttpStatusCode.Conflict)
        {
            _logger.LogInformation("WSO2 SCIM user {Username} already exists; skipping creation.", username);
            return;
        }

        if (!response.IsSuccessStatusCode)
        {
            var errBody = await response.Content.ReadAsStringAsync(ct);
            _logger.LogError("WSO2 SCIM provisioning failed for {Username}. Status {StatusCode}: {ResponseBody}", username, response.StatusCode, errBody);
            throw new AppException(502, "WSO2_SCIM_ERROR", "Failed to provision user in identity provider.");
        }
    }

    private string BuildEndpoint(string relativePath)
    {
        var authority = _config["Wso2:Authority"]?.TrimEnd('/');
        if (string.IsNullOrWhiteSpace(authority))
        {
            throw new AppException(500, "WSO2_CONFIG_INVALID", "Wso2:Authority must be configured.");
        }

        if (authority.EndsWith("/oauth2/token", StringComparison.OrdinalIgnoreCase) && relativePath.Equals("/oauth2/token", StringComparison.OrdinalIgnoreCase))
        {
            return authority;
        }

        return $"{authority}{relativePath}";
    }

    private sealed class Wso2TokenResponse
    {
        public string AccessToken { get; set; } = string.Empty;
        public string? RefreshToken { get; set; }
        public int ExpiresIn { get; set; }
    }
}
