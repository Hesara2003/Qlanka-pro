// backend/QueueLanka.API.Tests/ReportCsvValidationTests.cs

using FluentAssertions;
using Moq;
using QueueLanka.Queue.Data;
using QueueLanka.Queue.DTOs.Reports;
using QueueLanka.Queue.Services;
using System.Globalization;
using System.Text;

namespace QueueLanka.API.Tests;

public class ReportCsvValidationTests
{
    private const string ExpectedHeader = "Date,Center ID,Center Name,Tokens Issued,Served,Skipped,Cancelled,No Shows,Avg Wait Time (min),Avg Service Time (min),Peak Hour,Peak Hour Tokens,Active Counters";

    [Fact]
    public async Task GenerateDailyCenterSummaryCsvAsync_CsvHeaders_MatchExpectedColumns()
    {
        var service = BuildServiceWithSeedData(out _);

        var request = BuildRequest(new DateTime(2026, 3, 10), new DateTime(2026, 3, 10), new List<int> { 1, 2 });
        var (fileBytes, _) = await service.GenerateDailyCenterSummaryCsvAsync(request);

        var rows = ParseCsv(fileBytes);
        rows.Should().NotBeEmpty();
        rows[0].Keys.Should().ContainInOrder(ExpectedHeader.Split(','));
    }

    [Fact]
    public async Task GenerateDailyCenterSummaryCsvAsync_CsvBom_IsUtf8Bom()
    {
        var service = BuildServiceWithSeedData(out _);

        var request = BuildRequest(new DateTime(2026, 3, 10), new DateTime(2026, 3, 10), new List<int> { 1 });
        var (fileBytes, _) = await service.GenerateDailyCenterSummaryCsvAsync(request);

        fileBytes.Take(3).Should().Equal(new byte[] { 0xEF, 0xBB, 0xBF });
    }

    [Fact]
    public async Task GenerateDailyCenterSummaryCsvAsync_TotalTokensIssued_MatchesExpectedAggregate()
    {
        var service = BuildServiceWithSeedData(out _);

        var request = BuildRequest(new DateTime(2026, 3, 10), new DateTime(2026, 3, 10), new List<int> { 1 });
        var rows = ParseCsv((await service.GenerateDailyCenterSummaryCsvAsync(request)).fileBytes);
        var row = rows.Single(r => r["Center ID"] == "1");

        row["Tokens Issued"].Should().Be("8");
    }

    [Fact]
    public async Task GenerateDailyCenterSummaryCsvAsync_TotalServed_MatchesExpectedAggregate()
    {
        var service = BuildServiceWithSeedData(out _);
        var request = BuildRequest(new DateTime(2026, 3, 10), new DateTime(2026, 3, 10), new List<int> { 1 });
        var row = ParseCsv((await service.GenerateDailyCenterSummaryCsvAsync(request)).fileBytes).Single(r => r["Center ID"] == "1");

        row["Served"].Should().Be("4");
    }

    [Fact]
    public async Task GenerateDailyCenterSummaryCsvAsync_TotalSkipped_MatchesExpectedAggregate()
    {
        var service = BuildServiceWithSeedData(out _);
        var request = BuildRequest(new DateTime(2026, 3, 10), new DateTime(2026, 3, 10), new List<int> { 1 });
        var row = ParseCsv((await service.GenerateDailyCenterSummaryCsvAsync(request)).fileBytes).Single(r => r["Center ID"] == "1");

        row["Skipped"].Should().Be("1");
    }

    [Fact]
    public async Task GenerateDailyCenterSummaryCsvAsync_TotalCancelled_MatchesExpectedAggregate()
    {
        var service = BuildServiceWithSeedData(out _);
        var request = BuildRequest(new DateTime(2026, 3, 10), new DateTime(2026, 3, 10), new List<int> { 1 });
        var row = ParseCsv((await service.GenerateDailyCenterSummaryCsvAsync(request)).fileBytes).Single(r => r["Center ID"] == "1");

        row["Cancelled"].Should().Be("1");
    }

    [Fact]
    public async Task GenerateDailyCenterSummaryCsvAsync_NoShowCount_MatchesWaitingAndCalledAtEndOfDay()
    {
        var service = BuildServiceWithSeedData(out _);
        var request = BuildRequest(new DateTime(2026, 3, 10), new DateTime(2026, 3, 10), new List<int> { 1 });
        var row = ParseCsv((await service.GenerateDailyCenterSummaryCsvAsync(request)).fileBytes).Single(r => r["Center ID"] == "1");

        row["No Shows"].Should().Be("2");
    }

    [Fact]
    public async Task GenerateDailyCenterSummaryCsvAsync_AverageWaitTime_MatchesManualCalculationInMinutes()
    {
        var service = BuildServiceWithSeedData(out _);
        var request = BuildRequest(new DateTime(2026, 3, 10), new DateTime(2026, 3, 10), new List<int> { 1 });
        var row = ParseCsv((await service.GenerateDailyCenterSummaryCsvAsync(request)).fileBytes).Single(r => r["Center ID"] == "1");

        row["Avg Wait Time (min)"].Should().Be("9.2");
    }

    [Fact]
    public async Task GenerateDailyCenterSummaryCsvAsync_AverageServiceTime_MatchesManualCalculationInMinutes()
    {
        var service = BuildServiceWithSeedData(out _);
        var request = BuildRequest(new DateTime(2026, 3, 10), new DateTime(2026, 3, 10), new List<int> { 1 });
        var row = ParseCsv((await service.GenerateDailyCenterSummaryCsvAsync(request)).fileBytes).Single(r => r["Center ID"] == "1");

        row["Avg Service Time (min)"].Should().Be("13.8");
    }

    [Fact]
    public async Task GenerateDailyCenterSummaryCsvAsync_PeakHour_UsesHighestIssuedHour()
    {
        var service = BuildServiceWithSeedData(out _);
        var request = BuildRequest(new DateTime(2026, 3, 10), new DateTime(2026, 3, 10), new List<int> { 1 });
        var row = ParseCsv((await service.GenerateDailyCenterSummaryCsvAsync(request)).fileBytes).Single(r => r["Center ID"] == "1");

        row["Peak Hour"].Should().Be("08:00");
    }

    [Fact]
    public async Task GenerateDailyCenterSummaryCsvAsync_PeakHourTokenCount_MatchesExpectedAggregate()
    {
        var service = BuildServiceWithSeedData(out _);
        var request = BuildRequest(new DateTime(2026, 3, 10), new DateTime(2026, 3, 10), new List<int> { 1 });
        var row = ParseCsv((await service.GenerateDailyCenterSummaryCsvAsync(request)).fileBytes).Single(r => r["Center ID"] == "1");

        row["Peak Hour Tokens"].Should().Be("4");
    }

    [Fact]
    public async Task GenerateDailyCenterSummaryCsvAsync_ActiveCounters_MatchesDistinctServedCounters()
    {
        var service = BuildServiceWithSeedData(out _);
        var request = BuildRequest(new DateTime(2026, 3, 10), new DateTime(2026, 3, 10), new List<int> { 1 });
        var row = ParseCsv((await service.GenerateDailyCenterSummaryCsvAsync(request)).fileBytes).Single(r => r["Center ID"] == "1");

        row["Active Counters"].Should().Be("3");
    }

    [Fact]
    public async Task GenerateDailyCenterSummaryCsvAsync_DateRangeFilter_ExcludesOutsideTokens()
    {
        var service = BuildServiceWithSeedData(out _);

        var request = BuildRequest(new DateTime(2026, 3, 10), new DateTime(2026, 3, 10), new List<int>());
        var rows = ParseCsv((await service.GenerateDailyCenterSummaryCsvAsync(request)).fileBytes);

        rows.Should().OnlyContain(r => r["Date"] == "2026-03-10" || r["Date"] == "Total");
    }

    [Fact]
    public async Task GenerateDailyCenterSummaryCsvAsync_CenterFilter_ExcludesOtherCenters()
    {
        var service = BuildServiceWithSeedData(out _);

        var request = BuildRequest(new DateTime(2026, 3, 10), new DateTime(2026, 3, 10), new List<int> { 2 });
        var rows = ParseCsv((await service.GenerateDailyCenterSummaryCsvAsync(request)).fileBytes);

        rows.Where(r => r["Date"] != "Total").Should().OnlyContain(r => r["Center ID"] == "2");
    }

    [Fact]
    public async Task GenerateDailyCenterSummaryCsvAsync_SingleCenterFilter_ContainsOnlySingleCenterData()
    {
        var service = BuildServiceWithSeedData(out _);

        var request = BuildRequest(new DateTime(2026, 3, 10), new DateTime(2026, 3, 10), new List<int> { 1 });
        var rows = ParseCsv((await service.GenerateDailyCenterSummaryCsvAsync(request)).fileBytes);

        rows.Where(r => r["Date"] != "Total").Should().OnlyContain(r => r["Center ID"] == "1");
    }

    [Fact]
    public async Task GenerateDailyCenterSummaryCsvAsync_MultipleCenterFilter_IncludesOnlySpecifiedCenters()
    {
        var service = BuildServiceWithSeedData(out _);

        var request = BuildRequest(new DateTime(2026, 3, 10), new DateTime(2026, 3, 12), new List<int> { 1, 3 });
        var rows = ParseCsv((await service.GenerateDailyCenterSummaryCsvAsync(request)).fileBytes);

        rows.Where(r => r["Date"] != "Total").Select(r => r["Center ID"]).Distinct().Should().BeEquivalentTo(new[] { "1", "3" });
    }

    [Fact]
    public async Task GenerateDailyCenterSummaryCsvAsync_SummaryRowTotals_MatchSumOfDataRows()
    {
        var service = BuildServiceWithSeedData(out _);

        var request = BuildRequest(new DateTime(2026, 3, 10), new DateTime(2026, 3, 10), new List<int> { 1, 2 });
        var rows = ParseCsv((await service.GenerateDailyCenterSummaryCsvAsync(request)).fileBytes);

        var summary = rows.Last();
        summary["Date"].Should().Be("Total");

        var dataRows = rows.Take(rows.Count - 1).ToList();
        summary["Tokens Issued"].Should().Be(dataRows.Sum(r => ParseInt(r["Tokens Issued"])).ToString(CultureInfo.InvariantCulture));
        summary["Served"].Should().Be(dataRows.Sum(r => ParseInt(r["Served"])).ToString(CultureInfo.InvariantCulture));
        summary["Skipped"].Should().Be(dataRows.Sum(r => ParseInt(r["Skipped"])).ToString(CultureInfo.InvariantCulture));
        summary["Cancelled"].Should().Be(dataRows.Sum(r => ParseInt(r["Cancelled"])).ToString(CultureInfo.InvariantCulture));
        summary["No Shows"].Should().Be(dataRows.Sum(r => ParseInt(r["No Shows"])).ToString(CultureInfo.InvariantCulture));
    }

    [Fact]
    public async Task GenerateDailyCenterSummaryCsvAsync_CenterNameWithComma_IsQuotedCorrectly()
    {
        var service = BuildServiceWithSeedData(out _);

        var request = BuildRequest(new DateTime(2026, 3, 10), new DateTime(2026, 3, 10), new List<int> { 2 });
        var (_, fileName) = await service.GenerateDailyCenterSummaryCsvAsync(request);
        var rows = ParseCsv((await service.GenerateDailyCenterSummaryCsvAsync(request)).fileBytes);

        fileName.Should().Be("QueueLanka_DailySummary_20260310_20260310.csv");
        rows.Single(r => r["Center ID"] == "2")["Center Name"].Should().Be("North, Branch");
    }

    [Fact]
    public async Task GenerateDailyCenterSummaryCsvAsync_ZeroAverageWaitTime_DisplaysAsZeroPointZero()
    {
        var service = BuildServiceWithSeedData(out _);

        var request = BuildRequest(new DateTime(2026, 3, 12), new DateTime(2026, 3, 12), new List<int> { 3 });
        var rows = ParseCsv((await service.GenerateDailyCenterSummaryCsvAsync(request)).fileBytes);

        rows.Single(r => r["Center ID"] == "3")["Avg Wait Time (min)"].Should().Be("0.0");
    }

    [Fact]
    public async Task GenerateDailyCenterSummaryCsvAsync_EmptyDateRange_ReturnsHeadersOnly()
    {
        var service = BuildServiceWithSeedData(out _);

        var request = BuildRequest(new DateTime(2026, 2, 1), new DateTime(2026, 2, 1), new List<int>());
        var rows = ParseCsv((await service.GenerateDailyCenterSummaryCsvAsync(request)).fileBytes);

        rows.Should().BeEmpty();
    }

    private static DailyCenterSummaryRequestDto BuildRequest(DateTime fromDate, DateTime toDate, List<int> centerIds)
    {
        return new DailyCenterSummaryRequestDto
        {
            FromDate = fromDate,
            ToDate = toDate,
            CenterIds = centerIds,
            Format = "csv"
        };
    }

    private static ReportService BuildServiceWithSeedData(out List<SeedToken> seedTokens)
    {
        seedTokens = BuildSeedTokens();
        var localSeedTokens = seedTokens;
        var repositoryMock = new Mock<IReportRepository>();

        repositoryMock
            .Setup(r => r.GetDailyCenterSummaryAsync(It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<List<int>?>()))
            .ReturnsAsync((DateTime fromDate, DateTime toDate, List<int>? centerIds) =>
                BuildAggregates(localSeedTokens, fromDate, toDate, centerIds));

        return new ReportService(repositoryMock.Object);
    }

    private static List<SeedToken> BuildSeedTokens()
    {
        return new List<SeedToken>
        {
            new(1, "Main Center", 101, "Waiting",   new DateTime(2026, 3, 10, 8,  5, 0), null,                               null),
            new(1, "Main Center", 101, "Called",    new DateTime(2026, 3, 10, 8, 10, 0), new DateTime(2026, 3, 10, 8, 25, 0), null),
            new(1, "Main Center", 101, "Served",    new DateTime(2026, 3, 10, 8, 20, 0), new DateTime(2026, 3, 10, 8, 30, 0), new DateTime(2026, 3, 10, 8, 40, 0)),
            new(1, "Main Center", 102, "Served",    new DateTime(2026, 3, 10, 8, 40, 0), new DateTime(2026, 3, 10, 8, 50, 0), new DateTime(2026, 3, 10, 9,  5, 0)),
            new(1, "Main Center", 101, "Skipped",   new DateTime(2026, 3, 10, 9,  0, 0), new DateTime(2026, 3, 10, 9, 10, 0), null),
            new(1, "Main Center", 101, "Cancelled", new DateTime(2026, 3, 10, 9, 15, 0), null,                               null),
            new(1, "Main Center", 103, "Served",    new DateTime(2026, 3, 10, 14, 0, 0), new DateTime(2026, 3, 10, 14, 5, 0), new DateTime(2026, 3, 10, 14, 20, 0)),
            new(1, "Main Center", 103, "Completed", new DateTime(2026, 3, 10, 14,10, 0), new DateTime(2026, 3, 10, 14,15, 0), new DateTime(2026, 3, 10, 14, 30, 0)),

            new(2, "North, Branch", 201, "Served",    new DateTime(2026, 3, 10, 10, 0, 0), new DateTime(2026, 3, 10, 10, 5, 0), new DateTime(2026, 3, 10, 10, 20, 0)),
            new(2, "North, Branch", 201, "Waiting",   new DateTime(2026, 3, 10, 10,10, 0), null,                                null),
            new(2, "North, Branch", 201, "Cancelled", new DateTime(2026, 3, 10, 10,20, 0), null,                                null),

            new(3, "East Center", 301, "Waiting",     new DateTime(2026, 3, 12, 11, 0, 0), null,                                null),

            new(1, "Main Center", 101, "Served",      new DateTime(2026, 3, 8,  8, 0, 0), new DateTime(2026, 3, 8,  8,10, 0), new DateTime(2026, 3, 8,  8,20, 0))
        };
    }

    private static List<DailyCenterSummaryRowDto> BuildAggregates(List<SeedToken> tokens, DateTime fromDate, DateTime toDate, List<int>? centerIds)
    {
        var query = tokens
            .Where(t => t.IssuedAt.Date >= fromDate.Date && t.IssuedAt.Date <= toDate.Date);

        if (centerIds is { Count: > 0 })
        {
            query = query.Where(t => centerIds.Contains(t.CenterId));
        }

        var result = query
            .GroupBy(t => new { Day = DateOnly.FromDateTime(t.IssuedAt.Date), t.CenterId, t.CenterName })
            .Select(group =>
            {
                var waitSeconds = group
                    .Where(t => t.CalledAt.HasValue)
                    .Select(t => (t.CalledAt!.Value - t.IssuedAt).TotalSeconds)
                    .ToList();

                var serviceSeconds = group
                    .Where(t => t.CalledAt.HasValue && t.ServedAt.HasValue)
                    .Select(t => (t.ServedAt!.Value - t.CalledAt!.Value).TotalSeconds)
                    .ToList();

                var hourGroups = group
                    .GroupBy(t => t.IssuedAt.Hour)
                    .OrderByDescending(g => g.Count())
                    .ThenBy(g => g.Key)
                    .ToList();

                return new DailyCenterSummaryRowDto
                {
                    Date = group.Key.Day,
                    CenterId = group.Key.CenterId,
                    CenterName = group.Key.CenterName,
                    TotalTokensIssued = group.Count(),
                    TotalServed = group.Count(t => IsServedStatus(t.Status)),
                    TotalSkipped = group.Count(t => string.Equals(t.Status, "Skipped", StringComparison.OrdinalIgnoreCase)),
                    TotalCancelled = group.Count(t => string.Equals(t.Status, "Cancelled", StringComparison.OrdinalIgnoreCase)),
                    NoShowCount = group.Count(t => IsNoShowStatus(t.Status)),
                    AverageWaitTimeSeconds = waitSeconds.Count == 0 ? 0 : (int)Math.Round(waitSeconds.Average(), MidpointRounding.AwayFromZero),
                    AverageServiceTimeSeconds = serviceSeconds.Count == 0 ? 0 : (int)Math.Round(serviceSeconds.Average(), MidpointRounding.AwayFromZero),
                    PeakHour = hourGroups.Count == 0 ? 0 : hourGroups[0].Key,
                    PeakHourTokenCount = hourGroups.Count == 0 ? 0 : hourGroups[0].Count(),
                    ActiveCounters = group.Where(t => IsServedStatus(t.Status)).Select(t => t.CounterId).Distinct().Count()
                };
            })
            .OrderBy(r => r.Date)
            .ThenBy(r => r.CenterName)
            .ToList();

        return result;
    }

    private static bool IsServedStatus(string status)
    {
        return string.Equals(status, "Served", StringComparison.OrdinalIgnoreCase)
            || string.Equals(status, "Completed", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsNoShowStatus(string status)
    {
        return string.Equals(status, "Waiting", StringComparison.OrdinalIgnoreCase)
            || string.Equals(status, "Called", StringComparison.OrdinalIgnoreCase);
    }

    private static int ParseInt(string value)
    {
        return int.Parse(value, NumberStyles.Integer, CultureInfo.InvariantCulture);
    }

    private record SeedToken(
        int CenterId,
        string CenterName,
        int CounterId,
        string Status,
        DateTime IssuedAt,
        DateTime? CalledAt,
        DateTime? ServedAt);

    private static List<Dictionary<string, string>> ParseCsv(byte[] csvBytes)
    {
        var bom = Encoding.UTF8.GetPreamble();
        var text = Encoding.UTF8.GetString(csvBytes);
        if (text.Length > 0 && text[0] == '\uFEFF')
        {
            text = text[1..];
        }

        var records = ParseCsvLines(text);
        if (records.Count == 0)
        {
            return new List<Dictionary<string, string>>();
        }

        var headers = records[0];
        var rows = new List<Dictionary<string, string>>();

        foreach (var record in records.Skip(1))
        {
            if (record.Count == 1 && string.IsNullOrWhiteSpace(record[0]))
            {
                continue;
            }

            var row = new Dictionary<string, string>(StringComparer.Ordinal);
            for (var i = 0; i < headers.Count; i++)
            {
                row[headers[i]] = i < record.Count ? record[i] : string.Empty;
            }

            rows.Add(row);
        }

        return rows;
    }

    private static List<List<string>> ParseCsvLines(string input)
    {
        var result = new List<List<string>>();
        var currentRow = new List<string>();
        var currentField = new StringBuilder();
        var inQuotes = false;

        for (var i = 0; i < input.Length; i++)
        {
            var current = input[i];

            if (inQuotes)
            {
                if (current == '"')
                {
                    if (i + 1 < input.Length && input[i + 1] == '"')
                    {
                        currentField.Append('"');
                        i++;
                    }
                    else
                    {
                        inQuotes = false;
                    }
                }
                else
                {
                    currentField.Append(current);
                }

                continue;
            }

            if (current == '"')
            {
                inQuotes = true;
                continue;
            }

            if (current == ',')
            {
                currentRow.Add(currentField.ToString());
                currentField.Clear();
                continue;
            }

            if (current == '\r')
            {
                continue;
            }

            if (current == '\n')
            {
                currentRow.Add(currentField.ToString());
                currentField.Clear();
                result.Add(currentRow);
                currentRow = new List<string>();
                continue;
            }

            currentField.Append(current);
        }

        if (inQuotes)
        {
            throw new InvalidOperationException("CSV parsing failed: unmatched quote.");
        }

        if (currentField.Length > 0 || currentRow.Count > 0)
        {
            currentRow.Add(currentField.ToString());
            result.Add(currentRow);
        }

        return result;
    }
}
