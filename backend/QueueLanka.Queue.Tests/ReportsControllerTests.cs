using System;
using System.IO;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using QueueLanka.API.Controllers;
using QueueLanka.API.DTOs.Reports;
using QueueLanka.API.Services;
using Xunit;

namespace QueueLanka.API.Tests
{
    public class ReportsControllerTests
    {
        private readonly Mock<IReportService> _reportServiceMock;
        private readonly ReportsController _controller;

        public ReportsControllerTests()
        {
            _reportServiceMock = new Mock<IReportService>();
            _controller = new ReportsController(_reportServiceMock.Object);
        }

        [Fact]
        public async Task GetDashboardAnalytics_ReturnsOkResult_WithValidData()
        {
            // Arrange
            var req = new DashboardAnalyticsRequestDto { CenterId = "center-1", FromDate = "2026-04-19", ToDate = "2026-04-20" };
            var expectedDto = new DashboardAnalyticsDto { TotalBookings = 150 };
            
            _reportServiceMock.Setup(s => s.GetDashboardAnalyticsAsync(req))
                .ReturnsAsync(expectedDto);

            // Act
            var result = await _controller.GetDashboardAnalytics(req);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeAssignableTo<DashboardAnalyticsDto>().Subject;
            response.TotalBookings.Should().Be(150);
        }

        [Fact]
        public async Task GetDashboardAnalytics_HandlesEmptyDataset_ReturnsEmptyMetrics()
        {
            // Arrange
            var req = new DashboardAnalyticsRequestDto { CenterId = "empty-center" };
            var emptyDto = new DashboardAnalyticsDto { TotalBookings = 0, AverageWaitTimeSeconds = 0 };
            
            _reportServiceMock.Setup(s => s.GetDashboardAnalyticsAsync(req))
                .ReturnsAsync(emptyDto);

            // Act
            var result = await _controller.GetDashboardAnalytics(req);

            // Assert
            var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
            var response = okResult.Value.Should().BeAssignableTo<DashboardAnalyticsDto>().Subject;
            response.TotalBookings.Should().Be(0);
        }

        [Fact]
        public async Task DownloadCustomReport_ReturnsCsvFile_WhenRequestedFormatIsCsv()
        {
            // Arrange
            var req = new CustomReportRequestDto { Format = "csv", CenterId = "center-1" };
            var memoryStream = new MemoryStream(new byte[] { 1, 2, 3 });
            
            _reportServiceMock.Setup(s => s.GenerateCustomReportStreamAsync(req))
                .ReturnsAsync((memoryStream, "text/csv", "report.csv"));

            // Act
            var result = await _controller.DownloadCustomReport(req);

            // Assert
            var fileResult = result.Should().BeOfType<FileStreamResult>().Subject;
            fileResult.ContentType.Should().Be("text/csv");
            fileResult.FileDownloadName.Should().Be("report.csv");
        }

        [Fact]
        public async Task DownloadCustomReport_ReturnsBadRequest_ForInvalidFormat()
        {
            // Arrange
            var req = new CustomReportRequestDto { Format = "xml", CenterId = "center-1" };
            
            _reportServiceMock.Setup(s => s.GenerateCustomReportStreamAsync(req))
                .ThrowsAsync(new ArgumentException("Unsupported format"));

            // Act
            var result = await _controller.DownloadCustomReport(req);

            // Assert
            var badRequest = result.Should().BeOfType<BadRequestObjectResult>().Subject;
            badRequest.Value.Should().Be("Unsupported format");
        }
    }
}
