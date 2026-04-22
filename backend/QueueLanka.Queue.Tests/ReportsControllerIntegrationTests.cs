using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace QueueLanka.API.IntegrationTests
{
    public class ReportsControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;

        public ReportsControllerIntegrationTests(WebApplicationFactory<Program> factory)
        {
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task GetDashboardAnalytics_ReturnsSuccessAndApplicationJson()
        {
            // Act
            var response = await _client.GetAsync("/api/reports/dashboard");

            // Assert
            response.EnsureSuccessStatusCode(); 
            response.Content.Headers.ContentType.ToString().Should().Contain("application/json");
        }

        [Fact]
        public async Task DownloadCustomReport_ReturnsCsvDownload_ForCsvFormat()
        {
            // Arrange
            var centerId = "test-center-1";

            // Act
            var response = await _client.GetAsync($"/api/reports/custom/download?format=csv&centerId={centerId}");

            // Assert
            response.EnsureSuccessStatusCode(); 
            response.Content.Headers.ContentType.ToString().Should().Be("text/csv");
            response.Content.Headers.ContentDisposition.ToString().Should().Contain("attachment");
        }
    }
}
