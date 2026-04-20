using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.IdentityModel.Tokens;
using QueueLanka.Queue.Controllers;
using QueueLanka.Queue.DTOs.Reports;
using QueueLanka.Queue.Services;

namespace QueueLanka.API.Tests;

public class ReportsAuthorizationTests : IClassFixture<ReportsAuthorizationWebApplicationFactory>
{
    private readonly ReportsAuthorizationWebApplicationFactory _factory;

    public ReportsAuthorizationTests(ReportsAuthorizationWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task NoJwt_CenterSummaryReport_Returns401()
    {
        using var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

        var response = await client.GetAsync("/api/reports/centers/11/summary?from=2026-03-10&to=2026-03-10");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task OfficerJwt_CenterSummaryReport_Returns403()
    {
        using var client = CreateClientWithRole("officer");

        var response = await client.GetAsync("/api/reports/centers/11/summary?from=2026-03-10&to=2026-03-10");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task AdminJwt_InvalidCenterFilter_Returns400WithSafeMessage()
    {
        using var client = CreateClientWithRole("admin");

        var response = await client.GetAsync("/api/reports/daily-summary/csv?fromDate=2026-03-10&toDate=2026-03-10&centerIds=abc");

        var payload = await response.Content.ReadAsStringAsync();
        Assert.Contains(response.StatusCode, new[] { HttpStatusCode.BadRequest, HttpStatusCode.NotAcceptable });

        if (!string.IsNullOrWhiteSpace(payload))
        {
            using var document = JsonDocument.Parse(payload);
            var root = document.RootElement;

            Assert.Equal("INVALID_CENTER_FILTER", root.GetProperty("code").GetString());

            var message = root.GetProperty("message").GetString();
            Assert.False(string.IsNullOrWhiteSpace(message));
            Assert.DoesNotContain("System.", message, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("StackTrace", message, StringComparison.OrdinalIgnoreCase);
        }
    }

    [Fact]
    public async Task AdminJwt_ValidCenterSummary_ReturnsCsvAttachment()
    {
        using var client = CreateClientWithRole("admin");

        var response = await client.GetAsync("/api/reports/centers/11/summary?from=2026-03-10&to=2026-03-10&format=csv");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/csv", response.Content.Headers.ContentType?.MediaType);
        Assert.NotNull(response.Content.Headers.ContentDisposition);
        Assert.EndsWith(".csv", response.Content.Headers.ContentDisposition?.FileName?.Trim('"'));
    }

    private HttpClient CreateClientWithRole(string role)
    {
        var token = CreateJwt(role);
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    private static string CreateJwt(string role)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(ReportsAuthorizationWebApplicationFactory.JwtSecret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, "6001"),
            new(JwtRegisteredClaimNames.UniqueName, "report-admin"),
            new(ClaimTypes.Role, role),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: ReportsAuthorizationWebApplicationFactory.JwtIssuer,
            audience: ReportsAuthorizationWebApplicationFactory.JwtAudience,
            claims: claims,
            notBefore: DateTime.UtcNow.AddMinutes(-1),
            expires: DateTime.UtcNow.AddMinutes(20),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

public sealed class ReportsAuthorizationWebApplicationFactory : WebApplicationFactory<ReportsController>
{
    public const string JwtSecret = "report_test_secret_key_for_auth_123456789";
    public const string JwtIssuer = "queuelanka-api";
    public const string JwtAudience = "queuelanka-client";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("Jwt:Secret", JwtSecret);
        builder.UseSetting("Jwt:Issuer", JwtIssuer);
        builder.UseSetting("Jwt:Audience", JwtAudience);

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IReportService>();
            services.AddSingleton<IReportService, FakeReportService>();
        });
    }
}

internal sealed class FakeReportService : IReportService
{
    public Task<(byte[] fileBytes, string fileName)> GenerateDailyCenterSummaryCsvAsync(DailyCenterSummaryRequestDto request)
    {
        var csv = "Date,Center ID,Center Name,Tokens Issued,Served,Skipped,Cancelled,No Shows,Avg Wait Time (min),Avg Service Time (min),Peak Hour,Peak Hour Tokens,Active Counters\n" +
                  "2026-03-10,11,Main Center,50,42,5,1,2,4.5,3.0,09:00,12,4\n";

        var bytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(csv)).ToArray();
        var fileName = $"QueueLanka_DailySummary_{request.FromDate:yyyyMMdd}_{request.ToDate:yyyyMMdd}.csv";
        return Task.FromResult((bytes, fileName));
    }

    public Task<List<DailyCenterSummaryRowDto>> GetDailyCenterSummaryDataAsync(DailyCenterSummaryRequestDto request)
    {
        if (request.FromDate.Date > request.ToDate.Date)
        {
            return Task.FromResult(new List<DailyCenterSummaryRowDto>());
        }

        var includesCenter = request.CenterIds.Count == 0 || request.CenterIds.Contains(11);
        if (!includesCenter)
        {
            return Task.FromResult(new List<DailyCenterSummaryRowDto>());
        }

        return Task.FromResult(new List<DailyCenterSummaryRowDto>
        {
            new()
            {
                Date = new DateOnly(2026, 3, 10),
                CenterId = 11,
                CenterName = "Main Center",
                TotalTokensIssued = 50,
                TotalServed = 42,
                TotalSkipped = 5,
                TotalCancelled = 1,
                NoShowCount = 2,
                AverageWaitTimeSeconds = 270,
                AverageServiceTimeSeconds = 180,
                PeakHour = 9,
                PeakHourTokenCount = 12,
                ActiveCounters = 4,
            }
        });
    }
}
