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

    public async Task SendBookingEmailAsync(string toEmail, string toName, string centerName, string date, string time, string tokenNumber)
    {
        var subject  = $"Token Booking Confirmed: {tokenNumber}";
        var htmlBody = BuildBookingEmailHtml(toName, centerName, date, time, tokenNumber);
        var textBody = BuildBookingEmailText(toName, centerName, date, time, tokenNumber);

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

    private static string BuildBookingEmailHtml(string name, string centerName, string date, string time, string tokenNumber) => $"""
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
                  <h2 style="margin:0 0 12px;color:#1a1a2e;font-size:1.2rem">Booking Confirmed!</h2>
                  <p style="margin:0 0 20px;color:#374151;line-height:1.6">Hi {name},</p>
                  <p style="margin:0 0 28px;color:#374151;line-height:1.6">
                    Your token for <strong>{centerName}</strong> has been successfully booked. Please present the token number below when you arrive.
                  </p>
                  <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:28px;text-align:center;">
                    <p style="margin:0 0 8px;font-size:0.85rem;color:#6b7280;text-transform:uppercase;font-weight:600;letter-spacing:0.05em">Token Number</p>
                    <p style="margin:0;font-size:2rem;font-weight:800;color:#4f46e5;font-family:monospace">{tokenNumber}</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border-top:1px solid #e5e7eb;padding-top:16px;">
                        <tr>
                            <td width="50%" align="left">
                                <p style="margin:0;font-size:0.8rem;color:#6b7280;font-weight:600">Date</p>
                                <p style="margin:4px 0 0;font-size:1rem;color:#111827;font-weight:500">{date}</p>
                            </td>
                            <td width="50%" align="right">
                                <p style="margin:0;font-size:0.8rem;color:#6b7280;font-weight:600">Estimated Time</p>
                                <p style="margin:4px 0 0;font-size:1rem;color:#111827;font-weight:500">{time}</p>
                            </td>
                        </tr>
                    </table>
                  </div>
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

    private static string BuildBookingEmailText(string name, string centerName, string date, string time, string tokenNumber) =>
        $"""
        Hi {name},

        Your token for {centerName} has been successfully booked!

        TOKEN NUMBER: {tokenNumber}
        DATE: {date}
        TIME: {time}

        Please present this token number when you arrive at the center.

        — The QueueLanka Team
        """;
}
