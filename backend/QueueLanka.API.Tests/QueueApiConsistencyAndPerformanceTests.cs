using System.Diagnostics;
using System.IdentityModel.Tokens.Jwt;
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
using QueueLanka.Queue.DTOs.Counter;
using QueueLanka.Queue.DTOs.Reports;
using QueueLanka.Queue.DTOs.Token;
using QueueLanka.Queue.Services;

namespace QueueLanka.API.Tests;

public class QueueApiConsistencyAndPerformanceTests : IClassFixture<QueueApiConsistencyWebApplicationFactory>
{
    private readonly QueueApiConsistencyWebApplicationFactory _factory;

    public QueueApiConsistencyAndPerformanceTests(QueueApiConsistencyWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task DashboardStatsAndReportCsv_ShouldExposeConsistentServedAndSkippedCounts()
    {
        using var client = CreateAdminClient();

        var statsResponse = await client.GetAsync("/api/counters/4/stats");
        statsResponse.EnsureSuccessStatusCode();

        var statsJson = await statsResponse.Content.ReadAsStringAsync();
        using var statsDoc = JsonDocument.Parse(statsJson);
        var statsData = statsDoc.RootElement.GetProperty("data");

        var servedFromStats = statsData.GetProperty("servedCount").GetInt32();
        var skippedFromStats = statsData.GetProperty("skippedCount").GetInt32();

        var reportResponse = await client.GetAsync("/api/reports/centers/11/summary?from=2026-03-10&to=2026-03-10&format=csv");
        reportResponse.EnsureSuccessStatusCode();

        var csv = await reportResponse.Content.ReadAsStringAsync();
        var lines = csv.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
        Assert.True(lines.Length >= 2);

        var columns = lines[1].Split(',');
        var servedFromCsv = int.Parse(columns[4]);
        var skippedFromCsv = int.Parse(columns[5]);

        Assert.Equal(servedFromStats, servedFromCsv);
        Assert.Equal(skippedFromStats, skippedFromCsv);
    }

    [Fact]
    public async Task StatsEndpoint_ShouldReturnSecurityHeaders()
    {
        using var client = CreateAdminClient();

        var response = await client.GetAsync("/api/counters/4/stats");
        response.EnsureSuccessStatusCode();

        Assert.True(response.Headers.TryGetValues("X-Content-Type-Options", out var nosniffValues));
        Assert.Contains("nosniff", nosniffValues);

        Assert.True(response.Headers.TryGetValues("X-Frame-Options", out var frameValues));
        Assert.Contains("DENY", frameValues);

        Assert.True(response.Headers.TryGetValues("Referrer-Policy", out var referrerValues));
        Assert.Contains("no-referrer", referrerValues);

        Assert.True(response.Headers.TryGetValues("Content-Security-Policy", out var cspValues));
        Assert.Contains("default-src 'none'", cspValues.First());
    }

    [Fact]
    public async Task StatsEndpoint_P95Latency_ShouldStayUnder200Ms()
    {
        using var client = CreateAdminClient();
        var samples = new List<double>();

        for (var i = 0; i < 40; i++)
        {
            var stopwatch = Stopwatch.StartNew();
            var response = await client.GetAsync("/api/counters/4/stats");
            stopwatch.Stop();

            response.EnsureSuccessStatusCode();
            samples.Add(stopwatch.Elapsed.TotalMilliseconds);
        }

        var p95 = CalculatePercentile(samples, 0.95);
        Assert.True(p95 < 200, $"Expected stats endpoint p95 < 200ms, observed {p95:F2}ms.");
    }

    [Fact]
    public async Task ReportEndpoint_P95Latency_ShouldStayUnder250Ms()
    {
        using var client = CreateAdminClient();
        var samples = new List<double>();

        for (var i = 0; i < 30; i++)
        {
            var stopwatch = Stopwatch.StartNew();
            var response = await client.GetAsync("/api/reports/centers/11/summary?from=2026-03-10&to=2026-03-10&format=csv");
            stopwatch.Stop();

            response.EnsureSuccessStatusCode();
            samples.Add(stopwatch.Elapsed.TotalMilliseconds);
        }

        var p95 = CalculatePercentile(samples, 0.95);
        Assert.True(p95 < 250, $"Expected report endpoint p95 < 250ms, observed {p95:F2}ms.");
    }

    private HttpClient CreateAdminClient()
    {
        var token = CreateJwt("admin");
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    private static string CreateJwt(string role)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(QueueApiConsistencyWebApplicationFactory.JwtSecret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, "7001"),
            new(JwtRegisteredClaimNames.UniqueName, "qa-admin"),
            new(ClaimTypes.Role, role),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: QueueApiConsistencyWebApplicationFactory.JwtIssuer,
            audience: QueueApiConsistencyWebApplicationFactory.JwtAudience,
            claims: claims,
            notBefore: DateTime.UtcNow.AddMinutes(-1),
            expires: DateTime.UtcNow.AddMinutes(30),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static double CalculatePercentile(List<double> samples, double percentile)
    {
        var ordered = samples.OrderBy(x => x).ToList();
        var index = (int)Math.Ceiling(percentile * ordered.Count) - 1;
        var safeIndex = Math.Clamp(index, 0, ordered.Count - 1);
        return ordered[safeIndex];
    }
}

public sealed class QueueApiConsistencyWebApplicationFactory : WebApplicationFactory<CounterController>
{
    public const string JwtSecret = "consistency_test_secret_key_for_auth_12345";
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
            services.RemoveAll<IReportService>();
            services.AddSingleton<ICounterService, ConsistencyCounterServiceStub>();
            services.AddSingleton<IReportService, ConsistencyReportServiceStub>();
        });
    }
}

internal sealed class ConsistencyCounterServiceStub : ICounterService
{
    public Task<CallNextTokenResponseDto?> CallNextTokenAsync(int counterId)
    {
        throw new NotImplementedException();
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
            CounterName = "Counter 4",
            IsOpen = true,
            ServedCount = 42,
            SkippedCount = 5,
            AverageServiceTimeSeconds = 180,
            WaitingTokens = new List<WaitingTokenDto>(),
        };

        return Task.FromResult(dashboard);
    }

    public Task<IReadOnlyList<WaitingTokenDto>> GetWaitingTokensAsync(int counterId, int officerUserId)
    {
        return Task.FromResult<IReadOnlyList<WaitingTokenDto>>(Array.Empty<WaitingTokenDto>());
    }

    public Task<CounterResponseDto> CreateCounterAsync(CreateCounterRequestDto request, int adminUserId)
    {
        throw new NotImplementedException();
    }

    public Task<ListCountersResponseDto> GetCountersByCenterAsync(int centerId, int adminUserId)
    {
        throw new NotImplementedException();
    }

    public Task<CounterResponseDto> GetCounterByIdAsync(int centerId, int counterId, int adminUserId)
    {
        throw new NotImplementedException();
    }

    public Task<CounterResponseDto> UpdateCounterStatusAsync(int centerId, int counterId, UpdateCounterStatusRequestDto request, int adminUserId)
    {
        throw new NotImplementedException();
    }
}

internal sealed class ConsistencyReportServiceStub : IReportService
{
    public Task<(byte[] fileBytes, string fileName)> GenerateDailyCenterSummaryCsvAsync(DailyCenterSummaryRequestDto request)
    {
        var csv = "Date,Center ID,Center Name,Tokens Issued,Served,Skipped,Cancelled,No Shows,Avg Wait Time (min),Avg Service Time (min),Peak Hour,Peak Hour Tokens,Active Counters\n" +
                  "2026-03-10,11,Main Center,50,42,5,1,2,4.5,3.0,09:00,12,4\n";

        var payload = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(csv)).ToArray();
        var fileName = $"QueueLanka_DailySummary_{request.FromDate:yyyyMMdd}_{request.ToDate:yyyyMMdd}.csv";
        return Task.FromResult((payload, fileName));
    }

    public Task<List<DailyCenterSummaryRowDto>> GetDailyCenterSummaryDataAsync(DailyCenterSummaryRequestDto request)
    {
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
