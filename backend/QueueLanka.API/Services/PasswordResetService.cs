using System.Security.Cryptography;
using QueueLanka.API.Data;
using QueueLanka.API.Exceptions;
using QueueLanka.API.Models;

namespace QueueLanka.API.Services;

public class PasswordResetService : IPasswordResetService
{
    private const int TokenExpiryHours = 1;

    private readonly IPasswordResetRepository _resetRepo;
    private readonly IUserRepository          _users;
    private readonly IEmailService            _email;
    private readonly IConfiguration           _config;

    public PasswordResetService(
        IPasswordResetRepository resetRepo,
        IUserRepository          users,
        IEmailService            email,
        IConfiguration           config)
    {
        _resetRepo = resetRepo;
        _users     = users;
        _email     = email;
        _config    = config;
    }

    // ── Initiate reset ─────────────────────────────────────────
    public async Task InitiateResetAsync(string email)
    {
        var user = await _users.GetByEmailAsync(email);

        // Silently return when email is not found — prevents user enumeration
        if (user is null) return;

        // Generate URL-safe, cryptographically random 64-byte token
        var rawBytes = RandomNumberGenerator.GetBytes(64);
        var token    = Convert.ToBase64String(rawBytes)
                              .Replace('+', '-').Replace('/', '_').TrimEnd('=');

        var record = new PasswordResetToken
        {
            UserId    = user.UserId,
            Token     = token,
            ExpiresAt = DateTime.UtcNow.AddHours(TokenExpiryHours)
        };

        await _resetRepo.CreateAsync(record);

        var frontendBase = _config["App:FrontendBaseUrl"]?.TrimEnd('/')
                           ?? "http://localhost:5173";

        var resetUrl = $"{frontendBase}/reset-password?token={Uri.EscapeDataString(token)}";

        await _email.SendPasswordResetEmailAsync(email, user.Username, resetUrl);
    }

    // ── Complete reset ─────────────────────────────────────────
    public async Task ResetPasswordAsync(string token, string newPassword)
    {
        var record = await _resetRepo.GetValidByTokenAsync(token)
                     ?? throw new InvalidPasswordResetTokenException();

        // Hash the new password
        var newHash = BCrypt.Net.BCrypt.HashPassword(newPassword, workFactor: 12);

        // Update password and re-activate account (in case it was locked)
        await _users.UpdatePasswordAsync(record.UserId, newHash);

        // Consume the used token and invalidate any others for this user
        await _resetRepo.MarkUsedAsync(record.TokenId);
        await _resetRepo.InvalidateAllForUserAsync(record.UserId);
    }
}
