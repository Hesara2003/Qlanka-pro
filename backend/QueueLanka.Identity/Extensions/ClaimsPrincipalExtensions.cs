using System.Security.Claims;

namespace QueueLanka.Identity.Extensions;

public static class ClaimsPrincipalExtensions
{
    /// <summary>Returns the authenticated user's ID from the 'sub' claim.</summary>
    public static int GetUserId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue(ClaimTypes.NameIdentifier)
                 ?? user.FindFirstValue(JwtRegisteredClaimNames.Sub);

        return int.TryParse(value, out var id) ? id : 0;
    }

    /// <summary>Returns the authenticated user's role.</summary>
    public static string GetRole(this ClaimsPrincipal user)
        => user.FindFirstValue(ClaimTypes.Role) ?? string.Empty;

    /// <summary>Returns the authenticated user's username.</summary>
    public static string GetUsername(this ClaimsPrincipal user)
        => user.FindFirstValue(ClaimTypes.Name)
        ?? user.FindFirstValue(JwtRegisteredClaimNames.UniqueName)
        ?? string.Empty;

    /// <summary>Returns the officer's assigned centre ID, or null for citizens/admins.</summary>
    public static int? GetCenterId(this ClaimsPrincipal user)
    {
        var value = user.FindFirstValue("centerId");
        return int.TryParse(value, out var id) ? id : null;
    }

    // Shorthand that mirrors System.IdentityModel.Tokens.Jwt names without adding the full using
    private static class JwtRegisteredClaimNames
    {
        public const string Sub        = "sub";
        public const string UniqueName = "unique_name";
    }
}
