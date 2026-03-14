namespace QueueLanka.API.Exceptions;

/// <summary>
/// Exception thrown when a user attempts to book more than one active token at the same center on the same day.
/// </summary>
public class DuplicateBookingException : AppException
{
    public DuplicateBookingException(string message = "You already have an active token for this center today. Only one active token per center per day is allowed.")
        : base(409, "DUPLICATE_BOOKING", message)
    {
    }
}

/// <summary>
/// Exception thrown when a service center has reached its capacity limit for a specific date.
/// </summary>
public class CenterFullException : AppException
{
    public CenterFullException(string message = "This center is fully booked for the selected date. Please choose another date.")
        : base(409, "CENTER_FULL", message)
    {
    }
}
