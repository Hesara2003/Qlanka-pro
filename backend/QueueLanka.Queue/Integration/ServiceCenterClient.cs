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
        try
        {
            var response = await _httpClient.GetAsync($"/api/service-centers/{centerId}");
            if (!response.IsSuccessStatusCode) return null;

            var content = await response.Content.ReadAsStringAsync();
            var apiResponse = JsonSerializer.Deserialize<ApiResponse<ServiceCenterDto>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            return apiResponse?.Data;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get ServiceCenter {CenterId}", centerId);
            return null;
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
}
