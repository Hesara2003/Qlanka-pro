using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Moq;
using QueueLanka.Identity.Data;
using QueueLanka.Identity.DTOs.Auth;
using QueueLanka.Identity.Models;
using QueueLanka.Identity.Services;
using QueueLanka.Shared.Exceptions;
using System.IdentityModel.Tokens.Jwt;

namespace QueueLanka.Identity.Tests;

public class AuthServiceTests
{
    private readonly Mock<IUserRepository> _users = new();
    private readonly Mock<IEmailVerificationService> _emailVerification = new();
    private readonly IConfiguration _config;

    public AuthServiceTests()
    {
        _config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Secret"] = "super-secret-key-with-at-least-32-chars",
                ["Jwt:Issuer"] = "QueueLanka",
                ["Jwt:Audience"] = "QueueLankaClients",
                ["Jwt:AccessTokenExpiryMinutes"] = "60"
            })
            .Build();
    }

    [Fact]
    public async Task RegisterAsync_InvalidRole_ThrowsAppException()
    {
        var service = new AuthService(_users.Object, _emailVerification.Object, _config);
        var dto = new RegisterRequestDto
        {
            Username = "john",
            Password = "P@ssword1",
            Email = "john@example.com",
            Role = "manager"
        };

        Func<Task> act = async () => await service.RegisterAsync(dto);

        var ex = await act.Should().ThrowAsync<AppException>();
        ex.Which.Code.Should().Be("INVALID_ROLE");
    }

    [Fact]
    public async Task RegisterAsync_OfficerWithoutCenter_ThrowsAppException()
    {
        var service = new AuthService(_users.Object, _emailVerification.Object, _config);
        var dto = new RegisterRequestDto
        {
            Username = "officer1",
            Password = "P@ssword1",
            Email = "officer1@example.com",
            Role = "officer",
            CenterId = null
        };

        Func<Task> act = async () => await service.RegisterAsync(dto);

        var ex = await act.Should().ThrowAsync<AppException>();
        ex.Which.Code.Should().Be("CENTER_REQUIRED");
    }

    [Fact]
    public async Task RegisterAsync_ValidCitizen_HashesPasswordAndNormalizesRole()
    {
        User? savedUser = null;
        _users.Setup(x => x.GetByUsernameAsync("alice")).ReturnsAsync((User?)null);
        _users.Setup(x => x.GetByEmailAsync("alice@example.com")).ReturnsAsync((User?)null);
        _users
            .Setup(x => x.CreateAsync(It.IsAny<User>()))
            .Callback<User>(u => savedUser = u)
            .ReturnsAsync(17);

        var service = new AuthService(_users.Object, _emailVerification.Object, _config);
        var dto = new RegisterRequestDto
        {
            Username = "alice",
            Password = "P@ssword1",
            Email = "alice@example.com",
            Role = "Citizen"
        };

        var result = await service.RegisterAsync(dto);

        result.UserId.Should().Be(17);
        result.Role.Should().Be("citizen");
        savedUser.Should().NotBeNull();
        savedUser!.Role.Should().Be("citizen");
        savedUser.CenterId.Should().BeNull();
        savedUser.PasswordHash.Should().NotBe(dto.Password);
        BCrypt.Net.BCrypt.Verify(dto.Password, savedUser.PasswordHash).Should().BeTrue();
    }

    [Fact]
    public async Task LoginAsync_DisabledAccount_ThrowsAccountDisabledException()
    {
        var user = new User
        {
            UserId = 5,
            Username = "disabled",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("P@ssword1"),
            Role = "citizen",
            IsActive = false
        };
        _users.Setup(x => x.GetByUsernameAsync("disabled")).ReturnsAsync(user);
        var service = new AuthService(_users.Object, _emailVerification.Object, _config);

        Func<Task> act = async () => await service.LoginAsync(new LoginRequestDto
        {
            Username = "disabled",
            Password = "P@ssword1"
        });

        await act.Should().ThrowAsync<AccountDisabledException>();
    }

    [Fact]
    public async Task LoginAsync_ValidCitizen_ReturnsTokensAndJwt()
    {
        var user = new User
        {
            UserId = 9,
            Username = "citizen1",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("P@ssword1"),
            Role = "citizen",
            IsActive = true
        };
        _users.Setup(x => x.GetByUsernameAsync("citizen1")).ReturnsAsync(user);
        var service = new AuthService(_users.Object, _emailVerification.Object, _config);

        var result = await service.LoginAsync(new LoginRequestDto
        {
            Username = "citizen1",
            Password = "P@ssword1"
        });

        result.Token.Should().NotBeNullOrWhiteSpace();
        result.RefreshToken.Should().NotBeNullOrWhiteSpace();
        result.ExpiresIn.Should().Be(3600);
        result.Role.Should().Be("citizen");
        result.CounterId.Should().BeNull();

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(result.Token);
        jwt.Claims.Should().Contain(c => c.Type == JwtRegisteredClaimNames.Sub && c.Value == "9");
    }
}
