namespace QueueLanka.Identity.Services;

public interface IWso2IdentityService
{
    Task<Wso2TokenResult> RequestTokenAsync(string username, string password, CancellationToken ct = default);
    Task ProvisionUserAsync(string username, string password, string email, string role, int? centerId, CancellationToken ct = default);
}

public sealed record Wso2TokenResult(string AccessToken, string RefreshToken, int ExpiresIn);
