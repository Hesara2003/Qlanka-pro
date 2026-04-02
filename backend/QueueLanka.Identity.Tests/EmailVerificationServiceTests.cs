using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Moq;
using QueueLanka.Identity.Data;
using QueueLanka.Identity.Models;
using QueueLanka.Identity.Services;
using QueueLanka.Shared.Exceptions;

namespace QueueLanka.Identity.Tests;

public class EmailVerificationServiceTests
{
    private readonly Mock<IEmailVerificationRepository> _tokens = new();
    private readonly Mock<IUserRepository> _users = new();
    private readonly Mock<IEmailService> _email = new();

    private static IConfiguration BuildConfig(string? backendUrl = null)
    {
        var values = new Dictionary<string, string?>();
        if (!string.IsNullOrWhiteSpace(backendUrl))
        {
            values["App:BackendBaseUrl"] = backendUrl;
        }

        return new ConfigurationBuilder()
            .AddInMemoryCollection(values)
            .Build();
    }

    [Fact]
    public async Task SendVerificationAsync_UsesConfiguredBaseUrl_AndPersistsToken()
    {
        EmailVerificationToken? saved = null;
        string? sentUrl = null;

        _tokens.Setup(x => x.CreateAsync(It.IsAny<EmailVerificationToken>()))
            .Callback<EmailVerificationToken>(t => saved = t)
            .ReturnsAsync(1);
        _email.Setup(x => x.SendVerificationEmailAsync("alice@example.com", "alice", It.IsAny<string>()))
            .Callback<string, string, string>((_, _, url) => sentUrl = url)
            .Returns(Task.CompletedTask);

        var service = new EmailVerificationService(_tokens.Object, _users.Object, _email.Object, BuildConfig("https://api.qlanka.com/"));
        await service.SendVerificationAsync(12, "alice@example.com", "alice");

        saved.Should().NotBeNull();
        saved!.UserId.Should().Be(12);
        saved.Token.Should().NotBeNullOrWhiteSpace();
        saved.Token.Should().NotContain("+").And.NotContain("/").And.NotContain("=");

        sentUrl.Should().NotBeNull();
        sentUrl.Should().StartWith("https://api.qlanka.com/api/auth/verify-email?token=");
        Uri.UnescapeDataString(sentUrl!.Split("token=")[1]).Should().Be(saved.Token);
    }

    [Fact]
    public async Task SendVerificationAsync_UsesLocalhostFallback_WhenBaseUrlMissing()
    {
        _tokens.Setup(x => x.CreateAsync(It.IsAny<EmailVerificationToken>())).ReturnsAsync(1);
        string? sentUrl = null;
        _email.Setup(x => x.SendVerificationEmailAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Callback<string, string, string>((_, _, url) => sentUrl = url)
            .Returns(Task.CompletedTask);

        var service = new EmailVerificationService(_tokens.Object, _users.Object, _email.Object, BuildConfig());
        await service.SendVerificationAsync(5, "bob@example.com", "bob");

        sentUrl.Should().StartWith("http://localhost:5000/api/auth/verify-email?token=");
    }

    [Fact]
    public async Task VerifyAsync_WhenTokenInvalid_ThrowsInvalidVerificationTokenException()
    {
        _tokens.Setup(x => x.GetValidByTokenAsync("bad")).ReturnsAsync((EmailVerificationToken?)null);
        var service = new EmailVerificationService(_tokens.Object, _users.Object, _email.Object, BuildConfig());

        Func<Task> act = async () => await service.VerifyAsync("bad");

        await act.Should().ThrowAsync<InvalidVerificationTokenException>();
    }

    [Fact]
    public async Task VerifyAsync_ValidToken_MarksUsed_AndVerifiesUser()
    {
        _tokens.Setup(x => x.GetValidByTokenAsync("ok")).ReturnsAsync(new EmailVerificationToken
        {
            TokenId = 91,
            UserId = 33,
            Token = "ok"
        });

        var service = new EmailVerificationService(_tokens.Object, _users.Object, _email.Object, BuildConfig());
        await service.VerifyAsync("ok");

        _tokens.Verify(x => x.MarkUsedAsync(91), Times.Once);
        _users.Verify(x => x.SetEmailVerifiedAsync(33), Times.Once);
    }
}
