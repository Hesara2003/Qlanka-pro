using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace QueueLanka.API.Services;

/// <summary>
/// Sends transactional emails via SMTP using MailKit.
/// Configure the "Email" section in appsettings.json (or override via env vars in production).
/// </summary>
public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendVerificationEmailAsync(string toEmail, string toName, string verificationUrl)
    {
        var subject  = "Verify your QueueLanka account";
        var htmlBody = BuildVerificationEmailHtml(toName, verificationUrl);
        var textBody = BuildVerificationEmailText(toName, verificationUrl);

        await SendAsync(toEmail, toName, subject, htmlBody, textBody);
    }

    // ── Core send logic ────────────────────────────────────────
    private async Task SendAsync(
        string toEmail, string toName,
        string subject, string htmlBody, string textBody)
    {
        var host     = _config["Email:Smtp:Host"]     ?? throw new InvalidOperationException("Email:Smtp:Host is not set.");
        var portStr  = _config["Email:Smtp:Port"]     ?? "587";
        var username = _config["Email:Smtp:Username"] ?? throw new InvalidOperationException("Email:Smtp:Username is not set.");
        var password = _config["Email:Smtp:Password"] ?? throw new InvalidOperationException("Email:Smtp:Password is not set.");
        var fromAddr = _config["Email:From:Address"]  ?? throw new InvalidOperationException("Email:From:Address is not set.");
        var fromName = _config["Email:From:Name"]     ?? "QueueLanka";

        var port = int.Parse(portStr);

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(fromName, fromAddr));
        message.To.Add(new MailboxAddress(toName, toEmail));
        message.Subject = subject;

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = htmlBody,
            TextBody = textBody
        };
        message.Body = bodyBuilder.ToMessageBody();

        try
        {
            using var client = new SmtpClient();

            // Port 465 → SSL; 587/25 → STARTTLS opportunistic
            var secureOption = port == 465
                ? SecureSocketOptions.SslOnConnect
                : SecureSocketOptions.StartTlsWhenAvailable;

            await client.ConnectAsync(host, port, secureOption);
            await client.AuthenticateAsync(username, password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Verification email sent to {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send verification email to {Email}", toEmail);
            // Swallow: registration still succeeds; user can request resend later
        }
    }

    // ── Email templates ────────────────────────────────────────
    private static string BuildVerificationEmailHtml(string name, string url) => $"""
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
        <body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:40px 0">
            <tr><td align="center">
              <table width="520" cellpadding="0" cellspacing="0"
                     style="background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.08);overflow:hidden">
                <!-- Header -->
                <tr><td style="background:#4f46e5;padding:28px 40px">
                  <h1 style="margin:0;color:#fff;font-size:1.4rem;font-weight:700">QueueLanka Pro</h1>
                </td></tr>
                <!-- Body -->
                <tr><td style="padding:36px 40px 28px">
                  <h2 style="margin:0 0 12px;color:#1a1a2e;font-size:1.2rem">Verify your email address</h2>
                  <p style="margin:0 0 20px;color:#374151;line-height:1.6">Hi {name},</p>
                  <p style="margin:0 0 28px;color:#374151;line-height:1.6">
                    Thanks for registering with QueueLanka! Please verify your email address by clicking the button below.
                    This link expires in <strong>24 hours</strong>.
                  </p>
                  <table cellpadding="0" cellspacing="0">
                    <tr><td style="border-radius:8px;background:#4f46e5">
                      <a href="{url}"
                         style="display:inline-block;padding:14px 32px;color:#fff;font-weight:700;
                                font-size:0.95rem;text-decoration:none;border-radius:8px">
                        Verify my email
                      </a>
                    </td></tr>
                  </table>
                  <p style="margin:28px 0 0;color:#6b7280;font-size:0.8rem;line-height:1.5">
                    If the button doesn't work, copy and paste this link into your browser:<br />
                    <a href="{url}" style="color:#4f46e5;word-break:break-all">{url}</a>
                  </p>
                  <p style="margin:16px 0 0;color:#9ca3af;font-size:0.78rem">
                    If you didn't create an account, you can safely ignore this email.
                  </p>
                </td></tr>
                <!-- Footer -->
                <tr><td style="background:#f9fafb;padding:16px 40px;border-top:1px solid #f3f4f6">
                  <p style="margin:0;color:#9ca3af;font-size:0.75rem">
                    &copy; 2026 QueueLanka Pro. All rights reserved.
                  </p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """;

    private static string BuildVerificationEmailText(string name, string url) =>
        $"""
        Hi {name},

        Thanks for registering with QueueLanka Pro!

        Please verify your email address by visiting the link below.
        This link expires in 24 hours.

        {url}

        If you didn't create an account, please ignore this email.

        — The QueueLanka Team
        """;

    // ── Password reset ─────────────────────────────────────────
    public async Task SendPasswordResetEmailAsync(string toEmail, string toName, string resetUrl)
    {
        var subject  = "Reset your QueueLanka password";
        var htmlBody = BuildPasswordResetEmailHtml(toName, resetUrl);
        var textBody = BuildPasswordResetEmailText(toName, resetUrl);

        await SendAsync(toEmail, toName, subject, htmlBody, textBody);
    }

    private static string BuildPasswordResetEmailHtml(string name, string url) => $"""
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
        <body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:40px 0">
            <tr><td align="center">
              <table width="520" cellpadding="0" cellspacing="0"
                     style="background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,.08);overflow:hidden">
                <!-- Header -->
                <tr><td style="background:#dc2626;padding:28px 40px">
                  <h1 style="margin:0;color:#fff;font-size:1.4rem;font-weight:700">QueueLanka Pro</h1>
                </td></tr>
                <!-- Body -->
                <tr><td style="padding:36px 40px 28px">
                  <h2 style="margin:0 0 12px;color:#1a1a2e;font-size:1.2rem">Reset your password</h2>
                  <p style="margin:0 0 20px;color:#374151;line-height:1.6">Hi {name},</p>
                  <p style="margin:0 0 28px;color:#374151;line-height:1.6">
                    We received a request to reset your QueueLanka password.
                    Click the button below to choose a new password.
                    This link expires in <strong>1 hour</strong>.
                  </p>
                  <table cellpadding="0" cellspacing="0">
                    <tr><td style="border-radius:8px;background:#dc2626">
                      <a href="{url}"
                         style="display:inline-block;padding:14px 32px;color:#fff;font-weight:700;
                                font-size:0.95rem;text-decoration:none;border-radius:8px">
                        Reset my password
                      </a>
                    </td></tr>
                  </table>
                  <p style="margin:28px 0 0;color:#6b7280;font-size:0.8rem;line-height:1.5">
                    If the button doesn't work, copy and paste this link into your browser:<br />
                    <a href="{url}" style="color:#dc2626;word-break:break-all">{url}</a>
                  </p>
                  <p style="margin:16px 0 0;color:#9ca3af;font-size:0.78rem">
                    If you didn't request a password reset, you can safely ignore this email.
                    Your password will remain unchanged.
                  </p>
                </td></tr>
                <!-- Footer -->
                <tr><td style="background:#f9fafb;padding:16px 40px;border-top:1px solid #f3f4f6">
                  <p style="margin:0;color:#9ca3af;font-size:0.75rem">
                    &copy; 2026 QueueLanka Pro. All rights reserved.
                  </p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
        """;

    private static string BuildPasswordResetEmailText(string name, string url) =>
        $"""
        Hi {name},

        We received a request to reset your QueueLanka Pro password.

        Click the link below to set a new password. This link expires in 1 hour.

        {url}

        If you didn't request this, please ignore this email — your password will not change.

        — The QueueLanka Team
        """;
}
