using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace QueueLanka.Notification.Services;

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string htmlBody)
    {
        var toName = toEmail; // Fallback for name, assuming we just pass email
        var host     = _config["Email:Smtp:Host"]     ?? "localhost"; // default for MVP testing
        var portStr  = _config["Email:Smtp:Port"]     ?? "1025";
        var username = _config["Email:Smtp:Username"] ?? "test";
        var password = _config["Email:Smtp:Password"] ?? "test";
        var fromAddr = _config["Email:From:Address"]  ?? "noreply@queuelanka.com";
        var fromName = _config["Email:From:Name"]     ?? "QueueLanka";

        var port = int.TryParse(portStr, out var p) ? p : 1025;

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(fromName, fromAddr));
        message.To.Add(new MailboxAddress(toName, toEmail));
        message.Subject = subject;

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = htmlBody,
            TextBody = "Please view this email in a HTML capable email client."
        };
        message.Body = bodyBuilder.ToMessageBody();

        try
        {
            using var client = new SmtpClient();

            var secureOption = port == 465
                ? SecureSocketOptions.SslOnConnect
                : SecureSocketOptions.Auto;

            // Wait, for local MailHog MVP, don't use strict TLS if we can't
            if (host == "localhost" || host.Contains("mailhog"))
                secureOption = SecureSocketOptions.None;

            await client.ConnectAsync(host, port, secureOption);
            if (secureOption != SecureSocketOptions.None && !string.IsNullOrEmpty(username))
            {
                await client.AuthenticateAsync(username, password);
            }
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Email sent to {Email} with subject {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
        }
    }
}
