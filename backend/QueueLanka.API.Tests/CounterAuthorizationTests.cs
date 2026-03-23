// backend/QueueLanka.API.Tests/CounterAuthorizationTests.cs

using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.IdentityModel.Tokens;
using QueueLanka.Queue.Controllers;
using QueueLanka.Queue.DTOs.Counter;
using QueueLanka.Queue.DTOs.Token;
using QueueLanka.Queue.Services;

namespace QueueLanka.API.Tests;

public class CounterAuthorizationTests : IClassFixture<CounterAuthorizationWebApplicationFactory>
{
    private readonly CounterAuthorizationWebApplicationFactory _factory;

    public CounterAuthorizationTests(CounterAuthorizationWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task NoJwt_AdminCreateCounter_Returns401()
    {
        using var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        using var content = CreateJsonContent(new { name = "Counter A", centerId = 1 });

        var response = await client.PostAsync("/api/admin/centers/1/counters", content);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task OfficerJwt_AdminCreateCounter_Returns403()
    {
        using var client = CreateClientWithRole("officer");
        using var content = CreateJsonContent(new { name = "Counter A", centerId = 1 });

        var response = await client.PostAsync("/api/admin/centers/1/counters", content);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task CitizenJwt_AdminCreateCounter_Returns403()
    {
        using var client = CreateClientWithRole("citizen");
        using var content = CreateJsonContent(new { name = "Counter A", centerId = 1 });

        var response = await client.PostAsync("/api/admin/centers/1/counters", content);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task AdminJwt_AdminCreateCounter_Returns201Or400_Not401Or403()
    {
        using var client = CreateClientWithRole("admin");
        using var content = CreateJsonContent(new { name = "Counter A", centerId = 1 });

        var response = await client.PostAsync("/api/admin/centers/1/counters", content);

        Assert.Contains(response.StatusCode, new[] { HttpStatusCode.Created, HttpStatusCode.BadRequest });
        Assert.DoesNotContain(response.StatusCode, new[] { HttpStatusCode.Unauthorized, HttpStatusCode.Forbidden });
    }

    [Fact]
    public async Task NoJwt_OfficerDashboard_Returns401()
    {
        using var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

        var response = await client.GetAsync("/api/counters/1/dashboard");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CitizenJwt_OfficerDashboard_Returns403()
    {
        using var client = CreateClientWithRole("citizen");

        var response = await client.GetAsync("/api/counters/1/dashboard");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task OfficerJwt_OfficerDashboard_Returns200Or404()
    {
        using var client = CreateClientWithRole("officer");

        var response = await client.GetAsync("/api/counters/1/dashboard");

        Assert.Contains(response.StatusCode, new[] { HttpStatusCode.OK, HttpStatusCode.NotFound });
    }

    [Fact]
    public async Task ExpiredJwt_AnyEndpoint_Returns401()
    {
        using var client = CreateClientWithToken(CreateJwt("officer", expired: true));

        var response = await client.GetAsync("/api/counters/1/dashboard");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task TamperedJwtSignature_AnyEndpoint_Returns401()
    {
        var validToken = CreateJwt("officer");
        var tamperedToken = validToken[..^2] + "xx";

        using var client = CreateClientWithToken(tamperedToken);

        var response = await client.GetAsync("/api/counters/1/dashboard");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private HttpClient CreateClientWithRole(string role)
    {
        var token = CreateJwt(role);
        return CreateClientWithToken(token);
    }

    private HttpClient CreateClientWithToken(string token)
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    private static StringContent CreateJsonContent(object payload)
    {
        return new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
    }

    private static string CreateJwt(string role, bool expired = false)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(CounterAuthorizationWebApplicationFactory.JwtSecret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, "1001"),
            new(JwtRegisteredClaimNames.UniqueName, "test-user"),
            new(ClaimTypes.Role, role),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var expires = expired ? DateTime.UtcNow.AddMinutes(-10) : DateTime.UtcNow.AddMinutes(30);
        var notBefore = expired ? DateTime.UtcNow.AddMinutes(-20) : DateTime.UtcNow.AddMinutes(-1);

        var token = new JwtSecurityToken(
            issuer: CounterAuthorizationWebApplicationFactory.JwtIssuer,
            audience: CounterAuthorizationWebApplicationFactory.JwtAudience,
            claims: claims,
            notBefore: notBefore,
            expires: expires,
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public sealed class CounterAuthorizationWebApplicationFactory : WebApplicationFactory<CounterController>
{
    public const string JwtSecret = "test_secret_key_for_auth_tests_only_12345";
    public const string JwtIssuer = "queuelanka-api";
    public const string JwtAudience = "queuelanka-client";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("Jwt:Secret", JwtSecret);
        builder.UseSetting("Jwt:Issuer", JwtIssuer);
        builder.UseSetting("Jwt:Audience", JwtAudience);

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<ICounterService>();
            services.AddSingleton<ICounterService, FakeCounterService>();
        });
    }
}

internal sealed class FakeCounterService : ICounterService
{
    public Task<CallNextTokenResponseDto?> CallNextTokenAsync(int counterId)
    {
        return Task.FromResult<CallNextTokenResponseDto?>(null);
    }

    public Task<UpdateTokenStatusResponseDto> UpdateTokenStatusAsync(int counterId, int tokenId, string status)
    {
        throw new NotImplementedException();
    }

    public Task<ReassignTokenResponseDto> ReassignTokenAsync(int sourceCounterId, int tokenId, int targetCounterId, string? reason, int performedByUserId)
    {
        throw new NotImplementedException();
    }

    public Task<CounterDashboardDto> GetDashboardAsync(int counterId, int officerUserId)
    {
        var dashboard = new CounterDashboardDto
        {
            CounterId = counterId,
            CounterName = "Counter 1",
            IsOpen = true,
            ServedCount = 0,
            SkippedCount = 0,
            AverageServiceTimeSeconds = 0,
            WaitingTokens = new List<WaitingTokenDto>()
        };

        return Task.FromResult(dashboard);
    }

    public Task<IReadOnlyList<WaitingTokenDto>> GetWaitingTokensAsync(int counterId, int officerUserId)
    {
        return Task.FromResult<IReadOnlyList<WaitingTokenDto>>(Array.Empty<WaitingTokenDto>());
    }

    public Task<CounterResponseDto> CreateCounterAsync(CreateCounterRequestDto request, int adminUserId)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new System.ComponentModel.DataAnnotations.ValidationException("Name is required.");
        }

        var response = new CounterResponseDto
        {
            CounterId = 1,
            Name = request.Name,
            CenterId = request.CenterId,
            CenterName = "Main Center",
            IsOpen = false,
            CreatedAt = DateTime.UtcNow
        };

        return Task.FromResult(response);
    }

    public Task<ListCountersResponseDto> GetCountersByCenterAsync(int centerId, int adminUserId)
    {
        return Task.FromResult(new ListCountersResponseDto
        {
            CenterId = centerId,
            Counters = new List<CounterResponseDto>(),
            TotalCount = 0,
            OpenCount = 0,
            ClosedCount = 0
        });
    }

    public Task<CounterResponseDto> GetCounterByIdAsync(int centerId, int counterId, int adminUserId)
    {
        throw new KeyNotFoundException("Counter was not found.");
    }

    public Task<CounterResponseDto> UpdateCounterStatusAsync(int centerId, int counterId, UpdateCounterStatusRequestDto request, int adminUserId)
    {
        throw new KeyNotFoundException("Counter was not found.");
    }
}
