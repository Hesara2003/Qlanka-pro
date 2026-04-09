namespace QueueLanka.Identity.Services;

public interface IWso2IdentityService
{
    /// <summary>
    /// Provisions a newly registered user into WSO2 IS via SCIM2 API.
    /// Assigns the given role as a WSO2 group and sets optional centerId attribute.
    /// </summary>
    Task ProvisionUserAsync(string username, string password, string email, string role, int? centerId = null, CancellationToken ct = default);

    /// <summary>
    /// Exchanges username/password for a WSO2 IS access token via the ROPC grant.
    /// Throws <see cref="QueueLanka.Shared.Exceptions.AppException"/> on bad credentials or IS errors.
    /// </summary>
    Task<Wso2TokenResult> GetTokenAsync(string username, string password, CancellationToken ct = default);
}

public sealed record Wso2TokenResult(
    string AccessToken,
    string RefreshToken,
    int ExpiresIn,
    string Scope);
