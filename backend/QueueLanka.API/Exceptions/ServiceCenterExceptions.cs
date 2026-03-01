namespace QueueLanka.API.Exceptions;

/// <summary>
/// Exception for when a service center is not found - SCRUM-29
/// </summary>
public class ServiceCenterNotFoundException : AppException
{
    public int CenterId { get; }

    public ServiceCenterNotFoundException(int centerId)
        : base(404, "SERVICE_CENTER_NOT_FOUND", $"Service center with ID {centerId} was not found.")
    {
        CenterId = centerId;
    }
}

/// <summary>
/// Exception for when a service center is unavailable - SCRUM-29
/// </summary>
public class ServiceCenterUnavailableException : AppException
{
    public int CenterId { get; }

    public ServiceCenterUnavailableException(int centerId, string reason = "Service center is currently unavailable")
        : base(503, "SERVICE_CENTER_UNAVAILABLE", reason)
    {
        CenterId = centerId;
    }
}

/// <summary>
/// Exception for invalid service center data - SCRUM-29
/// </summary>
public class InvalidServiceCenterDataException : AppException
{
    public InvalidServiceCenterDataException(string message)
        : base(400, "INVALID_SERVICE_CENTER_DATA", message)
    {
    }
}

/// <summary>
/// Exception thrown when a service center with the same name and address already exists — SCRUM-65.
/// </summary>
public class DuplicateServiceCenterException : AppException
{
    public DuplicateServiceCenterException(string name, string address)
        : base(409, "DUPLICATE_SERVICE_CENTER",
               $"A service center named \"{name}\" already exists at \"{address}\".")
    {
    }
}

/// <summary>
/// Exception for database or data access errors - SCRUM-29
/// </summary>
public class DataAccessException : AppException
{
    public DataAccessException(string message, Exception? innerException = null)
        : base(500, "DATA_ACCESS_ERROR", message)
    {
    }
}

/// <summary>
/// Exception thrown when a center_locations row is requested but does not exist — SCRUM-74.
/// </summary>
public class LocationNotFoundException : AppException
{
    public LocationNotFoundException(int centerId)
        : base(404, "LOCATION_NOT_FOUND",
               $"No location record found for service center {centerId}.")
    {
    }
}
    {
        if (innerException != null)
        {
            // Store inner exception for logging purposes
            Data["InnerException"] = innerException.Message;
        }
    }
}
