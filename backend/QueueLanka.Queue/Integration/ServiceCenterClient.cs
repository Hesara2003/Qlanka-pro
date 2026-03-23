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
            var apiResponse = JsonSerializer.Deserialize<ApiResponse<JsonElement>>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            if (apiResponse?.Data.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null)
            {
                _logger.LogWarning("ServiceCenter {CenterId} response did not include a data payload", centerId);
                return null;
            }

            var data = apiResponse.Data;

            var openingTimeRaw = data.TryGetProperty("openingTime", out var openingProp)
                ? openingProp.GetString()
                : null;
            var closingTimeRaw = data.TryGetProperty("closingTime", out var closingProp)
                ? closingProp.GetString()
                : null;

            if (!TryParseCenterTime(openingTimeRaw, out var openingTime) || !TryParseCenterTime(closingTimeRaw, out var closingTime))
            {
                _logger.LogWarning(
                    "ServiceCenter {CenterId} has invalid opening/closing time format. opening='{Opening}', closing='{Closing}'",
                    centerId,
                    openingTimeRaw,
                    closingTimeRaw);
                return null;
            }

            return new ServiceCenterDto
            {
                CenterId = data.TryGetProperty("centerId", out var centerIdProp) ? centerIdProp.GetInt32() : centerId,
                Name = data.TryGetProperty("name", out var nameProp) ? (nameProp.GetString() ?? string.Empty) : string.Empty,
                IsActive = data.TryGetProperty("isActive", out var isActiveProp) && isActiveProp.GetBoolean(),
                Capacity = data.TryGetProperty("capacity", out var capacityProp) ? capacityProp.GetInt32() : 0,
                AverageServiceTimeMinutes = data.TryGetProperty("averageServiceTimeMinutes", out var avgProp) ? avgProp.GetInt32() : 15,
                OpeningTime = openingTime,
                ClosingTime = closingTime
            };
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

    private static bool TryParseCenterTime(string? rawTime, out TimeSpan time)
    {
        if (string.IsNullOrWhiteSpace(rawTime))
        {
            time = default;
            return false;
        }

        return TimeSpan.TryParse(rawTime, out time)
            || DateTime.TryParse(rawTime, out var asDateTime) && (time = asDateTime.TimeOfDay) >= TimeSpan.Zero;
    }
}
