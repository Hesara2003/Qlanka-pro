using FluentAssertions;
using Moq;
using QueueLanka.Queue.Data;
using QueueLanka.Queue.DTOs.Reports;
using QueueLanka.Queue.Services;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace QueueLanka.Queue.Tests;

public class ReportServiceTests
{
    private readonly Mock<IReportRepository> _repo = new();

    private ReportService CreateService() => new(_repo.Object);

    [Fact]
    public void CreateDailyCenterSummaryRequest_ParsesIds_Deduplicates_AndDefaultsFormat()
    {
        var service = CreateService();

        var request = service.CreateDailyCenterSummaryRequest(
            new DateTime(2026, 1, 1),
            new DateTime(2026, 1, 2),
            "1, 2,2, 3",
            null);

        request.CenterIds.Should().Equal(1, 2, 3);
        request.Format.Should().Be("csv");
    }

    [Fact]
    public void CreateDailyCenterSummaryRequest_InvalidCenterIds_ThrowsFormatException()
    {
        var service = CreateService();

        Action act = () => service.CreateDailyCenterSummaryRequest(
            new DateTime(2026, 1, 1),
            new DateTime(2026, 1, 2),
            "1,a,3");

        act.Should().Throw<FormatException>();
    }

    [Fact]
    public void CreateCenterDailySummaryRequest_InvalidCenterId_ThrowsValidationException()
    {
        var service = CreateService();
        Action act = () => service.CreateCenterDailySummaryRequest(0, DateTime.Today, DateTime.Today);
        act.Should().Throw<ValidationException>();
    }

    [Fact]
    public async Task GetDailyCenterSummaryDataAsync_InvalidDateRange_ThrowsValidationException()
    {
        var service = CreateService();
        var request = new DailyCenterSummaryRequestDto
        {
            FromDate = new DateTime(2026, 2, 1),
            ToDate = new DateTime(2026, 1, 1),
            CenterIds = new List<int> { 1 }
        };

        Func<Task> act = async () => await service.GetDailyCenterSummaryDataAsync(request);
        await act.Should().ThrowAsync<ValidationException>();
    }

    [Fact]
    public async Task GenerateDailyCenterSummaryCsvAsync_BuildsCsvTotals_AndUtf8Bom()
    {
        _repo.Setup(x => x.GetDailyCenterSummaryAsync(It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<List<int>?>()))
            .ReturnsAsync(new List<DailyCenterSummaryRowDto>
            {
                new()
                {
                    Date = new DateOnly(2026, 1, 1),
                    CenterId = 1,
                    CenterName = "Main, Center",
                    TotalTokensIssued = 10,
                    TotalServed = 7,
                    TotalSkipped = 1,
                    TotalCancelled = 1,
                    NoShowCount = 1,
                    AverageWaitTimeSeconds = 120,
                    AverageServiceTimeSeconds = 180,
                    PeakHour = 10,
                    PeakHourTokenCount = 4,
                    ActiveCounters = 2
                }
            });

        var service = CreateService();
        var request = new DailyCenterSummaryRequestDto
        {
            FromDate = new DateTime(2026, 1, 1),
            ToDate = new DateTime(2026, 1, 1),
            CenterIds = new List<int> { 1 }
        };

        var (bytes, fileName) = await service.GenerateDailyCenterSummaryCsvAsync(request);

        fileName.Should().Be("QueueLanka_DailySummary_20260101_20260101.csv");
        bytes.Take(3).Should().Equal(Encoding.UTF8.GetPreamble());
        var csv = Encoding.UTF8.GetString(bytes.Skip(3).ToArray());
        csv.Should().Contain("Date,Center ID,Center Name");
        csv.Should().Contain("\"Main, Center\"");
        csv.Should().Contain("Total,,,10,7,1,1,1");
    }

    [Fact]
    public async Task GenerateDailyCenterSummaryCsvAsync_WhenNoRows_StillReturnsHeader()
    {
        _repo.Setup(x => x.GetDailyCenterSummaryAsync(It.IsAny<DateTime>(), It.IsAny<DateTime>(), It.IsAny<List<int>?>()))
            .ReturnsAsync(new List<DailyCenterSummaryRowDto>());

        var service = CreateService();
        var request = new DailyCenterSummaryRequestDto
        {
            FromDate = new DateTime(2026, 1, 1),
            ToDate = new DateTime(2026, 1, 2),
            CenterIds = new List<int>()
        };

        var (bytes, _) = await service.GenerateDailyCenterSummaryCsvAsync(request);
        var csv = Encoding.UTF8.GetString(bytes.Skip(3).ToArray());
        csv.Split(Environment.NewLine, StringSplitOptions.RemoveEmptyEntries).Should().HaveCount(1);
    }
}
