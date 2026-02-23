using System.Security.Cryptography;
using QueueLanka.API.Data;
using QueueLanka.API.Exceptions;
using QueueLanka.API.Models;

namespace QueueLanka.API.Services;

public class EmailVerificationService : IEmailVerificationService
{
    private const int TokenExpiryHours = 24;

    private readonly IEmailVerificationRepository _tokenRepo;
    private readonly IUserRepository              _users;
    private readonly IEmailService                _email;
    private readonly IConfiguration               _config;

    public EmailVerificationService(
        IEmailVerificationRepository tokenRepo,
        IUserRepository              users,
        IEmailService                email,
        IConfiguration               config)
    {
        _tokenRepo = tokenRepo;
        _users     = users;
        _email     = email;
        _config    = config;
    }

    // ── Send verification email ────────────────────────────────
    public async Task SendVerificationAsync(int userId, string email, string username)
    {
        // Generate a URL-safe, cryptographically random 64-byte token
        var rawBytes = RandomNumberGenerator.GetBytes(64);
        var token    = Convert.ToBase64String(rawBytes)
                              .Replace('+', '-').Replace('/', '_').TrimEnd('=');

        var record = new EmailVerificationToken
        {
            UserId    = userId,
            Token     = token,
            ExpiresAt = DateTime.UtcNow.AddHours(TokenExpiryHours)
        };

        await _tokenRepo.CreateAsync(record);

        // Build the verification URL pointing at the frontend page
        var baseUrl = _config["App:FrontendBaseUrl"]?.TrimEnd('/')
                      ?? "http://localhost:5173";

        var verificationUrl = $"{baseUrl}/verify-email?token={Uri.EscapeDataString(token)}";

        await _email.SendVerificationEmailAsync(email, username, verificationUrl);
    }

    // ── Verify token ───────────────────────────────────────────
    public async Task VerifyAsync(string token)
    {
        var record = await _tokenRepo.GetValidByTokenAsync(token)
                     ?? throw new InvalidVerificationTokenException();

        // Mark token as consumed first (idempotency guard)
        await _tokenRepo.MarkUsedAsync(record.TokenId);

        // Activate the user's email
        await _users.SetEmailVerifiedAsync(record.UserId);
    }
}
