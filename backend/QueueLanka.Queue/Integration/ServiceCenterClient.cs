using System.Text.Json;
using QueueLanka.Shared.DTOs.Common;

namespace QueueLanka.Queue.Integration;

public class ServiceCenterClient : IServiceCenterClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ServiceCenterClient> _logger;

    public ServiceCenterClient(IHttpClientFactory httpClientFactory, ILogger<ServiceCenterClient> logger)
    {
        _httpClient = httpClientFactory.CreateClient("ServiceCenter");
        _logger = logger;
    }

    public async Task<ServiceCenterDto?> GetCenterAsync(int centerId)
    {
        var centers = await GetCentersAsync();
        return centers.FirstOrDefault(center => center.CenterId == centerId);
    }

    private async Task<List<ServiceCenterDto>> GetCentersAsync()
    {
        try
        {
            var response = await _httpClient.GetAsync("/api/service-centers");
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "ServiceCenter list lookup failed. Status={StatusCode}. Returning empty list.",
                    (int)response.StatusCode);
                return new List<ServiceCenterDto>();
            }

            var content = await response.Content.ReadAsStringAsync();
            var apiResponse = JsonSerializer.Deserialize<ApiResponse<List<ServiceCenterDto>>>(
                content,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            var centers = apiResponse?.Data ?? new List<ServiceCenterDto>();

            foreach (var center in centers)
            {
                center.OpeningTime = ParseTimeOrZero(center.OpeningTimeRaw);
                center.ClosingTime = ParseTimeOrZero(center.ClosingTimeRaw);
            }

            return centers;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get ServiceCenter list");
            return new List<ServiceCenterDto>();
        }
    }

    public async Task<CenterAvailabilityDto?> GetAvailabilityAsync(int centerId, DateTime date)
    {
        // For the MVP, if there is no endpoint for specific availability, we return null to fall back to default operating days.
        return await Task.FromResult<CenterAvailabilityDto?>(null);
    }

    public async Task<IEnumerable<CenterOperatingDayDto>> GetOperatingDaysAsync(int centerId)
    {
        // Defaults if the endpoint is not implemented yet in MVP
        return new List<CenterOperatingDayDto>();
    }

    private static TimeSpan ParseTimeOrZero(string? rawTime)
    {
        if (string.IsNullOrWhiteSpace(rawTime))
        {
            return TimeSpan.Zero;
        }

        try
        {
            return TimeSpan.Parse(rawTime);
        }
        catch
        {
            return TimeSpan.Zero;
        }
    }
}
