using QueueLanka.API.DTOs.ServiceCenter;

namespace QueueLanka.API.Services;

public interface IServiceCenterService
{
    Task<IEnumerable<ServiceCenterDto>> GetAllServiceCentersAsync();
    Task<ServiceCenterDto?> GetServiceCenterByIdAsync(int centerId);
}
