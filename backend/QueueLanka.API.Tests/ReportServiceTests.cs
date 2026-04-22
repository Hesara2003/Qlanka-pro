// backend/QueueLanka.API.Tests/ReportServiceTests.cs

using FluentAssertions;
using Moq;
using QueueLanka.Queue.Data;
using QueueLanka.Queue.DTOs.Reports;
using QueueLanka.Queue.Services;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace QueueLanka.API.Tests;

public class ReportServiceTests
{
    private readonly Mock<IReportRepository> _mockReportRepository;
    private readonly ReportService _service;

    public ReportServiceTests()
    {
        _mockReportRepository = new Mock<IReportRepository>();
        _service = new ReportService(_mockReportRepository.Object);
    }

    [Fact]
    public async Task GenerateDailyCenterSummaryCsvAsync_ValidRequest_ReturnsCsvWithCorrectHeaders()
    {
        var request = BuildRequest();

        _mockReportRepository
            .Setup(r => r.GetDailyCenterSummaryAsync(request.FromDate.Date, request.ToDate.Date, request.CenterIds))
            .ReturnsAsync(new List<DailyCenterSummaryRowDto>());

        var (fileBytes, _) = await _service.GenerateDailyCenterSummaryCsvAsync(request);
        var csvText = GetCsvText(fileBytes);

        csvText.Should().StartWith("Date,Center ID,Center Name,Tokens Issued,Served,Skipped,Cancelled,No Shows,Avg Wait Time (min),Avg Service Time (min),Peak Hour,Peak Hour Tokens,Active Counters");
    }

    [Fact]
    public async Task GenerateDailyCenterSummaryCsvAsync_ValidRequestWithData_ReturnsRowsWithExpectedValues()
    {
        var request = BuildRequest();
        var rows = new List<DailyCenterSummaryRowDto>
        {
            new()
            {
                Date = new DateOnly(2026, 3, 10),
                CenterId = 1,
                CenterName = "Central Office",
                TotalTokensIssued = 12,
                TotalServed = 9,
                TotalSkipped = 1,
                TotalCancelled = 1,
                NoShowCount = 1,
                AverageWaitTimeSeconds = 300,
                AverageServiceTimeSeconds = 420,
                PeakHour = 14,
                PeakHourTokenCount = 5,
                ActiveCounters = 3
            }
        };

        _mockReportRepository
            .Setup(r => r.GetDailyCenterSummaryAsync(request.FromDate.Date, request.ToDate.Date, request.CenterIds))
            .ReturnsAsync(rows);

        var (fileBytes, fileName) = await _service.GenerateDailyCenterSummaryCsvAsync(request);
        var csvText = GetCsvText(fileBytes);

        fileName.Should().Be("QueueLanka_DailySummary_20260310_20260310.csv");
        csvText.Should().Contain("2026-03-10,1,\"Central Office\",12,9,1,1,1,5.0,7.0,14:00,5,3");
    }

    [Fact]
    public async Task GenerateDailyCenterSummaryCsvAsync_EmptyResult_ReturnsHeadersOnlyWithoutException()
    {
        var request = BuildRequest();

        _mockReportRepository
            .Setup(r => r.GetDailyCenterSummaryAsync(request.FromDate.Date, request.ToDate.Date, request.CenterIds))
            .ReturnsAsync(new List<DailyCenterSummaryRowDto>());

        var (fileBytes, _) = await _service.GenerateDailyCenterSummaryCsvAsync(request);
        var csvText = GetCsvText(fileBytes).TrimEnd();
        var lines = csvText.Split('\n');

        lines.Should().HaveCount(1);
        lines[0].TrimEnd('\r').Should().Be("Date,Center ID,Center Name,Tokens Issued,Served,Skipped,Cancelled,No Shows,Avg Wait Time (min),Avg Service Time (min),Peak Hour,Peak Hour Tokens,Active Counters");
    }

    [Fact]
    public async Task GetDailyCenterSummaryDataAsync_DateRangeExceeds90Days_ThrowsValidationException()
    {
        var request = BuildRequest();
        request.ToDate = request.FromDate.AddDays(91);

        Func<Task> act = async () => await _service.GetDailyCenterSummaryDataAsync(request);

        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task GetDailyCenterSummaryDataAsync_ToDateBeforeFromDate_ThrowsValidationException()
    {
        var request = BuildRequest();
        request.ToDate = request.FromDate.AddDays(-1);

        Func<Task> act = async () => await _service.GetDailyCenterSummaryDataAsync(request);

        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task GetDailyCenterSummaryDataAsync_CenterFilterApplied_OnlySpecifiedCentersReturned()
    {
        var request = BuildRequest();
        request.CenterIds = new List<int> { 2 };

        var rows = new List<DailyCenterSummaryRowDto>
        {
            new() { Date = new DateOnly(2026, 3, 10), CenterId = 2, CenterName = "Branch", TotalTokensIssued = 3 }
        };

        _mockReportRepository
            .Setup(r => r.GetDailyCenterSummaryAsync(request.FromDate.Date, request.ToDate.Date, request.CenterIds))
            .ReturnsAsync(rows);

        var result = await _service.GetDailyCenterSummaryDataAsync(request);

        result.Should().OnlyContain(r => r.CenterId == 2);
        _mockReportRepository.Verify(r => r.GetDailyCenterSummaryAsync(request.FromDate.Date, request.ToDate.Date, request.CenterIds), Times.Once);
    }

    [Fact]
    public async Task GenerateDailyCenterSummaryCsvAsync_CsvEscapesCommasAndQuotesInCenterName()
    {
        var request = BuildRequest();

        _mockReportRepository
            .Setup(r => r.GetDailyCenterSummaryAsync(request.FromDate.Date, request.ToDate.Date, request.CenterIds))
            .ReturnsAsync(new List<DailyCenterSummaryRowDto>
            {
                new()
                {
                    Date = new DateOnly(2026, 3, 10),
                    CenterId = 1,
                    CenterName = "Main, \"HQ\"",
                    TotalTokensIssued = 1,
                    PeakHour = 9
                }
            });

        var (fileBytes, _) = await _service.GenerateDailyCenterSummaryCsvAsync(request);
        var csvText = GetCsvText(fileBytes);

        csvText.Should().Contain("\"Main, \"\"HQ\"\"\"");
    }

    [Fact]
    public async Task GenerateDailyCenterSummaryCsvAsync_AverageTimesFormattedInMinutesWithOneDecimal()
    {
        var request = BuildRequest();

        _mockReportRepository
            .Setup(r => r.GetDailyCenterSummaryAsync(request.FromDate.Date, request.ToDate.Date, request.CenterIds))
            .ReturnsAsync(new List<DailyCenterSummaryRowDto>
            {
                new()
                {
                    Date = new DateOnly(2026, 3, 10),
                    CenterId = 1,
                    CenterName = "Center A",
                    TotalTokensIssued = 1,
                    AverageWaitTimeSeconds = 90,
                    AverageServiceTimeSeconds = 330,
                    PeakHour = 8
                }
            });

        var (fileBytes, _) = await _service.GenerateDailyCenterSummaryCsvAsync(request);
        var csvText = GetCsvText(fileBytes);

        csvText.Should().Contain(",1.5,5.5,08:00,");
    }

    [Fact]
    public async Task GenerateDailyCenterSummaryCsvAsync_SummaryRowTotalsAreCorrect()
    {
        var request = BuildRequest();

        _mockReportRepository
            .Setup(r => r.GetDailyCenterSummaryAsync(request.FromDate.Date, request.ToDate.Date, request.CenterIds))
            .ReturnsAsync(new List<DailyCenterSummaryRowDto>
            {
                new()
                {
                    Date = new DateOnly(2026, 3, 10),
                    CenterId = 1,
                    CenterName = "Center A",
                    TotalTokensIssued = 10,
                    TotalServed = 8,
                    TotalSkipped = 1,
                    TotalCancelled = 1,
                    NoShowCount = 0,
                    PeakHour = 10,
                    PeakHourTokenCount = 4,
                    ActiveCounters = 2
                },
                new()
                {
                    Date = new DateOnly(2026, 3, 10),
                    CenterId = 2,
                    CenterName = "Center B",
                    TotalTokensIssued = 5,
                    TotalServed = 3,
                    TotalSkipped = 1,
                    TotalCancelled = 0,
                    NoShowCount = 1,
                    PeakHour = 11,
                    PeakHourTokenCount = 2,
                    ActiveCounters = 1
                }
            });

        var (fileBytes, _) = await _service.GenerateDailyCenterSummaryCsvAsync(request);
        var csvText = GetCsvText(fileBytes);

        csvText.Should().Contain("Total,,,15,11,2,1,1,,,,6,3");
    }

    [Fact]
    public void CreateCustomReportRequest_WithoutDateAndMetrics_UsesDefaults()
    {
        var request = _service.CreateCustomReportRequest(
            fromDate: null,
            toDate: null,
            centerIds: "1,2",
            statuses: "Waiting,Served",
            metrics: null);

        request.CenterIds.Should().BeEquivalentTo(new[] { 1, 2 });
        request.Statuses.Should().BeEquivalentTo(new[] { "Waiting", "Served" });
        request.Metrics.Should().Contain(new[]
        {
            "totalAppointments",
            "totalQueuedUsers",
            "completedTokens",
            "cancelledAppointments",
            "totalTokensIssued",
            "serviceCount",
            "averageWaitingTimeSeconds",
            "averageServiceTimeSeconds"
        });
        request.ToDate.Date.Should().BeCloseTo(DateTime.UtcNow.Date, TimeSpan.FromDays(1));
        request.FromDate.Date.Should().Be(request.ToDate.Date.AddDays(-30));
    }

    [Fact]
    public void CreateCustomReportRequest_UnsupportedStatus_ThrowsValidationException()
    {
        Action act = () => _service.CreateCustomReportRequest(
            fromDate: new DateTime(2026, 3, 1),
            toDate: new DateTime(2026, 3, 2),
            centerIds: "1",
            statuses: "InvalidStatus",
            metrics: "totalTokensIssued");

        act.Should().Throw<ValidationException>()
            .WithMessage("*Unsupported status*");
    }

    [Fact]
    public async Task GetCustomReportAsync_SelectedMetricsOnly_ReturnsRequestedAggregates()
    {
        var request = _service.CreateCustomReportRequest(
            fromDate: new DateTime(2026, 3, 1),
            toDate: new DateTime(2026, 3, 2),
            centerIds: "1",
            statuses: "Served,Completed",
            metrics: "totalTokensIssued,averageWaitingTimeSeconds");

        _mockReportRepository
            .Setup(r => r.GetCustomReportAggregatesAsync(
                request.FromDate.Date,
                request.ToDate.Date,
                request.CenterIds,
                request.Statuses))
            .ReturnsAsync(new CustomReportAggregateDataDto
            {
                TotalTokensIssued = 44,
                AverageWaitingTimeSeconds = 310.5m,
                TotalAppointments = 20,
                TotalQueuedUsers = 2,
                CompletedTokens = 18,
                CancelledAppointments = 1,
                ServiceCount = 18,
                AverageServiceTimeSeconds = 240.2m
            });

        var result = await _service.GetCustomReportAsync(request);

        result.SelectedMetrics.Should().BeEquivalentTo(new[]
        {
            "totalTokensIssued",
            "averageWaitingTimeSeconds"
        });

        result.AggregatedResults.Should().HaveCount(2);
        result.AggregatedResults["totalTokensIssued"].Should().Be(44);
        result.AggregatedResults["averageWaitingTimeSeconds"].Should().Be(310.5m);

        _mockReportRepository.Verify(r => r.GetCustomReportAggregatesAsync(
            request.FromDate.Date,
            request.ToDate.Date,
            request.CenterIds,
            request.Statuses), Times.Once);
    }

    private static DailyCenterSummaryRequestDto BuildRequest()
    {
        return new DailyCenterSummaryRequestDto
        {
            FromDate = new DateTime(2026, 3, 10),
            ToDate = new DateTime(2026, 3, 10),
            CenterIds = new List<int>(),
            Format = "csv"
        };
    }

    private static string GetCsvText(byte[] fileBytes)
    {
        var bom = Encoding.UTF8.GetPreamble();
        fileBytes.Take(3).Should().Equal(bom);

        return Encoding.UTF8.GetString(fileBytes, bom.Length, fileBytes.Length - bom.Length);
    }
}
