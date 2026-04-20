using System.IdentityModel.Tokens.Jwt;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;
using System.Text;
using System.Text.Json;
using UglyToad.PdfPig;
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

    [Fact]
    public async Task NoJwt_CustomReport_Returns401()
    {
        using var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

        var response = await client.GetAsync("/api/reports/custom?fromDate=2026-03-10&toDate=2026-03-10&metrics=total_served");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task AdminJwt_CustomReport_WithMetricsAndPaging_ReturnsAggregates()
    {
        using var client = CreateClientWithRole("admin");

        var response = await client.GetAsync("/api/reports/custom?fromDate=2026-03-10&toDate=2026-03-10&centerIds=11&statuses=Served,Skipped&metrics=total_served,total_skipped&groupBy=center&page=1&pageSize=50");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var payload = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(payload);
        var root = document.RootElement;

        Assert.True(root.GetProperty("success").GetBoolean());
        Assert.Equal("center", root.GetProperty("data").GetProperty("groupBy").GetString());
        Assert.True(root.GetProperty("metadata").GetProperty("totalCount").GetInt32() > 0);

        var firstRow = root.GetProperty("data").GetProperty("rows")[0];
        Assert.Equal(11, firstRow.GetProperty("centerId").GetInt32());
        Assert.Equal(42, firstRow.GetProperty("metrics").GetProperty("total_served").GetDouble());
        Assert.Equal(5, firstRow.GetProperty("metrics").GetProperty("total_skipped").GetDouble());
    }

    [Fact]
    public async Task AdminJwt_CustomReport_FormatCsv_ReturnsCsvAttachment()
    {
        using var client = CreateClientWithRole("admin");

        var response = await client.GetAsync("/api/reports/custom?fromDate=2026-03-10&toDate=2026-03-10&metrics=total_served,total_skipped&groupBy=center&format=csv");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("text/csv", response.Content.Headers.ContentType?.MediaType);
        Assert.NotNull(response.Content.Headers.ContentDisposition);
        Assert.EndsWith(".csv", response.Content.Headers.ContentDisposition?.FileName?.Trim('"'));
    }

    [Fact]
    public async Task AdminJwt_CustomReport_Csv_MatchesJsonPreviewData()
    {
        using var client = CreateClientWithRole("admin");
        const string query = "/api/reports/custom?fromDate=2026-03-10&toDate=2026-03-10&centerIds=11&statuses=Served,Skipped&metrics=total_served,total_skipped&groupBy=center&page=1&pageSize=50";

        var jsonResponse = await client.GetAsync(query);
        Assert.Equal(HttpStatusCode.OK, jsonResponse.StatusCode);

        using var jsonDoc = JsonDocument.Parse(await jsonResponse.Content.ReadAsStringAsync());
        var jsonRow = jsonDoc.RootElement.GetProperty("data").GetProperty("rows")[0];
        var jsonCenterId = jsonRow.GetProperty("centerId").GetInt32();
        var jsonCenterName = jsonRow.GetProperty("centerName").GetString();
        var jsonServed = jsonRow.GetProperty("metrics").GetProperty("total_served").GetDouble();
        var jsonSkipped = jsonRow.GetProperty("metrics").GetProperty("total_skipped").GetDouble();

        var csvResponse = await client.GetAsync(query + "&format=csv");
        Assert.Equal(HttpStatusCode.OK, csvResponse.StatusCode);

        var csvContent = Encoding.UTF8.GetString(await csvResponse.Content.ReadAsByteArrayAsync());
        csvContent = csvContent.TrimStart('\uFEFF');
        var lines = csvContent
            .Split(new[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries)
            .ToList();

        Assert.True(lines.Count >= 2);

        var header = ParseCsvLine(lines[0]);
        var firstRow = ParseCsvLine(lines[1]);

        var headerIndex = header
            .Select((value, index) => new { value, index })
            .ToDictionary(x => x.value, x => x.index, StringComparer.OrdinalIgnoreCase);

        Assert.Equal(jsonCenterId.ToString(CultureInfo.InvariantCulture), firstRow[headerIndex["Center ID"]]);
        Assert.Equal(jsonCenterName, firstRow[headerIndex["Center Name"]]);
        Assert.Equal(jsonServed.ToString("0.##", CultureInfo.InvariantCulture), firstRow[headerIndex["total_served"]]);
        Assert.Equal(jsonSkipped.ToString("0.##", CultureInfo.InvariantCulture), firstRow[headerIndex["total_skipped"]]);
    }

    [Fact]
    public async Task AdminJwt_CustomReport_Csv_PagedExport_ReturnsCurrentPageOnly()
    {
        using var client = CreateClientWithRole("admin");

        var response = await client.GetAsync("/api/reports/custom?fromDate=2026-03-10&toDate=2026-03-10&metrics=total_served,total_skipped&groupBy=center&page=2&pageSize=200&format=csv");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var csv = Encoding.UTF8.GetString(await response.Content.ReadAsByteArrayAsync()).TrimStart('\uFEFF');
        var lines = csv.Split(new[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries);

        Assert.Equal(201, lines.Length);
    }

    [Fact]
    public async Task AdminJwt_CustomReport_Csv_StreamedExportAll_ReturnsAllPagesForLargeDataset()
    {
        using var client = CreateClientWithRole("admin");

        var response = await client.GetAsync("/api/reports/custom?fromDate=2026-03-10&toDate=2026-03-10&metrics=total_served,total_skipped&groupBy=center&page=1&pageSize=200&format=csv&exportAll=true");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var csv = Encoding.UTF8.GetString(await response.Content.ReadAsByteArrayAsync()).TrimStart('\uFEFF');
        var lines = csv.Split(new[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries);

        Assert.Equal(1201, lines.Length);

        var header = ParseCsvLine(lines[0]);
        var firstDataRow = ParseCsvLine(lines[1]);
        var lastDataRow = ParseCsvLine(lines[^1]);
        var headerIndex = header
            .Select((value, index) => new { value, index })
            .ToDictionary(x => x.value, x => x.index, StringComparer.OrdinalIgnoreCase);

        Assert.Equal("11", firstDataRow[headerIndex["Center ID"]]);
        Assert.Equal("Main Center 1", firstDataRow[headerIndex["Center Name"]]);
        Assert.Equal("1210", lastDataRow[headerIndex["Center ID"]]);
        Assert.Equal("Main Center 1200", lastDataRow[headerIndex["Center Name"]]);
    }

    [Fact]
    public async Task AdminJwt_CustomReport_FormatPdf_ReturnsPdfAttachment()
    {
        using var client = CreateClientWithRole("admin");

        var response = await client.GetAsync("/api/reports/custom?fromDate=2026-03-10&toDate=2026-03-10&metrics=total_served,total_skipped&groupBy=center&format=pdf");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/pdf", response.Content.Headers.ContentType?.MediaType);
        Assert.NotNull(response.Content.Headers.ContentDisposition);
        Assert.EndsWith(".pdf", response.Content.Headers.ContentDisposition?.FileName?.Trim('"'));

        var bytes = await response.Content.ReadAsByteArrayAsync();
        Assert.True(bytes.Length > 4);
        Assert.Equal('%', (char)bytes[0]);
        Assert.Equal('P', (char)bytes[1]);
        Assert.Equal('D', (char)bytes[2]);
        Assert.Equal('F', (char)bytes[3]);
    }

    [Fact]
    public async Task AdminJwt_CustomReport_Pdf_ContainsJsonPreviewValues()
    {
        using var client = CreateClientWithRole("admin");
        const string query = "/api/reports/custom?fromDate=2026-03-10&toDate=2026-03-10&centerIds=11&statuses=Served,Skipped&metrics=total_served,total_skipped&groupBy=center&page=1&pageSize=50";

        var jsonResponse = await client.GetAsync(query);
        Assert.Equal(HttpStatusCode.OK, jsonResponse.StatusCode);

        using var jsonDoc = JsonDocument.Parse(await jsonResponse.Content.ReadAsStringAsync());
        var jsonRow = jsonDoc.RootElement.GetProperty("data").GetProperty("rows")[0];
        var centerName = jsonRow.GetProperty("centerName").GetString() ?? string.Empty;
        var served = jsonRow.GetProperty("metrics").GetProperty("total_served").GetDouble().ToString("0.##", CultureInfo.InvariantCulture);
        var skipped = jsonRow.GetProperty("metrics").GetProperty("total_skipped").GetDouble().ToString("0.##", CultureInfo.InvariantCulture);

        var pdfResponse = await client.GetAsync(query + "&format=pdf");
        Assert.Equal(HttpStatusCode.OK, pdfResponse.StatusCode);

        var bytes = await pdfResponse.Content.ReadAsByteArrayAsync();
        using var stream = new MemoryStream(bytes);
        using var pdf = PdfDocument.Open(stream);

        var fullText = string.Join("\n", pdf.GetPages().Select(page => page.Text));

        Assert.Contains("QueueLanka Custom Report", fullText, StringComparison.OrdinalIgnoreCase);
        Assert.Contains(centerName, fullText, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("total_served", fullText, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("total_skipped", fullText, StringComparison.OrdinalIgnoreCase);
        Assert.Contains(served, fullText, StringComparison.Ordinal);
        Assert.Contains(skipped, fullText, StringComparison.Ordinal);
    }

    [Fact]
    public async Task AdminJwt_CustomReport_InvalidFormat_Returns400()
    {
        using var client = CreateClientWithRole("admin");

        var response = await client.GetAsync("/api/reports/custom?fromDate=2026-03-10&toDate=2026-03-10&metrics=total_served&format=xlsx");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var payload = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(payload);
        Assert.Equal("INVALID_FORMAT", document.RootElement.GetProperty("code").GetString());
    }

    [Fact]
    public async Task AdminJwt_CustomReport_InvalidMetric_Returns400()
    {
        using var client = CreateClientWithRole("admin");

        var response = await client.GetAsync("/api/reports/custom?fromDate=2026-03-10&toDate=2026-03-10&metrics=unknown_metric");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var payload = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(payload);
        Assert.Equal("VALIDATION_ERROR", document.RootElement.GetProperty("code").GetString());
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

    private static List<string> ParseCsvLine(string line)
    {
        var values = new List<string>();
        var current = new StringBuilder();
        var inQuotes = false;

        for (var i = 0; i < line.Length; i++)
        {
            var ch = line[i];

            if (ch == '"')
            {
                if (inQuotes && i + 1 < line.Length && line[i + 1] == '"')
                {
                    current.Append('"');
                    i++;
                    continue;
                }

                inQuotes = !inQuotes;
                continue;
            }

            if (ch == ',' && !inQuotes)
            {
                values.Add(current.ToString());
                current.Clear();
                continue;
            }

            current.Append(ch);
        }

        values.Add(current.ToString());
        return values;
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

    public Task<CustomReportResponseDto> GetCustomReportAsync(CustomReportQueryDto request)
    {
        var metrics = request.Metrics
            .Select(metric => metric.Trim().ToLowerInvariant())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var supportedMetrics = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "total_tokens_issued",
            "total_served",
            "total_skipped",
            "total_cancelled",
            "no_show_count",
            "avg_wait_time_seconds",
            "avg_service_time_seconds",
            "active_counters"
        };

        var unsupported = metrics.Where(metric => !supportedMetrics.Contains(metric)).ToList();
        if (unsupported.Count > 0)
        {
            throw new ValidationException($"Unsupported metrics: {string.Join(", ", unsupported)}");
        }

        const int totalGroups = 1200;
        var pageSize = request.PageSize;
        var start = (request.Page - 1) * pageSize + 1;
        var end = Math.Min(start + pageSize - 1, totalGroups);

        var rows = new List<CustomReportRowDto>();
        if (start <= totalGroups)
        {
            for (var i = start; i <= end; i++)
            {
                var row = new CustomReportRowDto
                {
                    CenterId = 10 + i,
                    CenterName = $"Main Center {i}"
                };

                foreach (var metric in metrics)
                {
                    row.Metrics[metric] = metric switch
                    {
                        "total_tokens_issued" => 50,
                        "total_served" => 42,
                        "total_skipped" => 5,
                        "total_cancelled" => 1,
                        "no_show_count" => 2,
                        "avg_wait_time_seconds" => 270,
                        "avg_service_time_seconds" => 180,
                        "active_counters" => 4,
                        _ => 0
                    };
                }

                rows.Add(row);
            }
        }

        var response = new CustomReportResponseDto
        {
            GroupBy = request.GroupBy,
            Metrics = metrics,
            Page = request.Page,
            PageSize = request.PageSize,
            TotalGroups = totalGroups,
            Rows = rows
        };

        return Task.FromResult(response);
    }
}
