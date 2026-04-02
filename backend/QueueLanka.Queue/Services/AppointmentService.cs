using QueueLanka.Queue.Data;
using QueueLanka.Queue.DTOs.Appointment;
using QueueLanka.Shared.Exceptions;
using QueueLanka.Shared.Events;
using QueueLanka.Queue.Models;
using QueueLanka.Queue.Integration;

namespace QueueLanka.Queue.Services;
public class AppointmentService : IAppointmentService
{
    private readonly IAppointmentRepository _appointmentRepository;
    private readonly IServiceCenterClient _serviceCenterClient;
    private readonly ITokenRepository _tokenRepository;
    private readonly IEventBus _eventBus;
    private readonly ILogger<AppointmentService> _logger;

    public AppointmentService(
        IAppointmentRepository appointmentRepository,
        IServiceCenterClient serviceCenterClient,
        ITokenRepository tokenRepository,
        IEventBus eventBus,
        ILogger<AppointmentService> logger)
    {
        _appointmentRepository = appointmentRepository;
        _serviceCenterClient = serviceCenterClient;
        _tokenRepository = tokenRepository;
        _eventBus = eventBus;
        _logger = logger;
    }

    public async Task<AppointmentResponseDto> BookTokenAsync(int userId, BookAppointmentRequestDto requestDto)
    {
        // 1. Validate Service Center exists
        var center = await _serviceCenterClient.GetCenterAsync(requestDto.CenterId);
        if (center == null || !center.IsActive)
        {
            _logger.LogWarning(
                "BookToken center validation failed. UserId={UserId}, CenterId={CenterId}, CenterExists={CenterExists}, IsActive={IsActive}, Date={Date}, Time={Time}",
                userId,
                requestDto.CenterId,
                center is not null,
                center?.IsActive,
                requestDto.AppointmentDate,
                requestDto.AppointmentTime);
            throw new ArgumentException("Service center not found or is currently inactive.");
        }

        var requestedDate = requestDto.AppointmentDate.Date;
        var requestedTime = requestDto.AppointmentTime;

        // 2. Prevent booking in the past
        var currentUtc = DateTime.UtcNow;
        // Basic check assuming server time, a more robust check would convert to center timezone
        if (requestedDate < currentUtc.Date || (requestedDate == currentUtc.Date && requestedTime < currentUtc.TimeOfDay))
        {
             throw new InvalidOperationException("Cannot book an appointment in the past.");
        }

        // 3. Conflict Resolution: Unavailable Slots (Is the center open?)
        // Fetch specific day overrides first
        var specificAvailability = await _serviceCenterClient.GetAvailabilityAsync(center.CenterId, requestedDate);
        if (specificAvailability != null)
        {
            if (!specificAvailability.IsAvailable)
                throw new InvalidOperationException($"Center is closed on this date. Reason: {specificAvailability.Reason}");

            var openTime = specificAvailability.OpeningTime ?? center.OpeningTime;
            var closeTime = specificAvailability.ClosingTime ?? center.ClosingTime;

            if (requestedTime < openTime || requestedTime > closeTime)
                throw new InvalidOperationException($"Requested time is outside operating hours for this date ({openTime} to {closeTime}).");
        }
        else
        {
            // Default weekly schedule check
            var operatingDays = (await _serviceCenterClient.GetOperatingDaysAsync(center.CenterId)).ToList();

            TimeSpan openTime;
            TimeSpan closeTime;

            if (operatingDays.Count == 0)
            {
                // Fallback defaults: weekdays 09:00-17:00 when operating-days data is unavailable.
                _logger.LogWarning(
                    "Operating days unavailable for CenterId={CenterId}. Using default weekday hours (09:00-17:00).",
                    center.CenterId);

                var dayOfWeek = requestedDate.DayOfWeek;
                if (dayOfWeek is DayOfWeek.Saturday or DayOfWeek.Sunday)
                {
                    throw new InvalidOperationException("Center is closed on this day of the week.");
                }

                openTime = new TimeSpan(9, 0, 0);
                closeTime = new TimeSpan(17, 0, 0);
            }
            else
            {
                var dayOfWeekStr = requestedDate.DayOfWeek.ToString().ToLower();
                var operatingDay = operatingDays.FirstOrDefault(d => d.DayOfWeek == dayOfWeekStr);

                if (operatingDay == null || !operatingDay.IsOpen)
                    throw new InvalidOperationException("Center is closed on this day of the week.");

                openTime = operatingDay.OpeningTime ?? center.OpeningTime;
                closeTime = operatingDay.ClosingTime ?? center.ClosingTime;
            }

            if (requestedTime < openTime || requestedTime > closeTime)
                throw new InvalidOperationException($"Requested time is outside operating hours ({openTime} to {closeTime}).");
        }

        // 4, 5, 6, 7. Atomic Booking (Conflict / Duplicate / Capacity / Insert)
        string shortDate = requestedDate.ToString("yyMMdd");
        string randomHex = Guid.NewGuid().ToString("N").Substring(0, 4).ToUpper();
        string tokenNumber = $"TKN-{center.CenterId}-{shortDate}-{randomHex}";

        var (apptId, tokenId, resultCode) = await _appointmentRepository.BookAtomicAsync(
            center.CenterId, userId, requestedDate, requestedTime, tokenNumber, center.Capacity);

        switch ((resultCode ?? string.Empty).Trim().ToUpperInvariant())
        {
            case "CENTER_NOT_FOUND":
                throw new ArgumentException("Service center not found or is currently inactive.");
            case "DUPLICATE_BOOKING":
                throw new DuplicateBookingException();
            case "TIME_CONFLICT":
                throw new InvalidOperationException("This time slot is already booked. Please select another time.");
            case "SLOT_FULL":
            case "CENTER_FULL":
                throw new CenterFullException();
            case "SUCCESS":
                break;
            default:
                throw new Exception($"Unexpected error during atomic booking: {resultCode}");
        }

        // We need the instances for the notification service
        var createdAppointment = await _appointmentRepository.GetByIdAsync(apptId);
        var createdToken = await _tokenRepository.GetByIdAsync(tokenId);

        if (createdAppointment == null || createdToken == null)
            throw new Exception("Booking succeeded but records could not be retrieved.");

        // 8. Dispatch Async Notifications (Fire-And-Forget so we don't block the HTTP Response)
        _ = Task.Run(async () =>
        {
            try
            {
                var bookingConfirmedEvent = new BookingConfirmedEvent
                {
                    UserId = createdAppointment.UserId,
                    UserEmail = string.Empty,
                    UserName = $"user-{createdAppointment.UserId}",
                    AppointmentId = createdAppointment.AppointmentId,
                    TokenId = createdToken.TokenId,
                    TokenNumber = createdToken.TokenNumber,
                    CenterId = createdAppointment.CenterId,
                    CenterName = center.Name,
                    AppointmentDate = createdAppointment.AppointmentDate,
                    AppointmentTime = createdAppointment.AppointmentTime
                };

                await _eventBus.PublishAsync(bookingConfirmedEvent);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Background notification dispatch failed for Token {TokenId}", createdToken.TokenId);
            }
        });

        return new AppointmentResponseDto
        {
            AppointmentId = createdAppointment.AppointmentId,
            CenterId = createdAppointment.CenterId,
            UserId = createdAppointment.UserId,
            TokenId = createdToken.TokenId,
            TokenNumber = createdToken.TokenNumber,
            AppointmentDate = createdAppointment.AppointmentDate,
            AppointmentTime = createdAppointment.AppointmentTime,
            Status = createdAppointment.Status,
            CreatedAt = createdAppointment.CreatedAt
        };
    }

    public async Task<IEnumerable<AppointmentResponseDto>> GetUserAppointmentsAsync(int userId)
    {
        var appointmentsTask = _appointmentRepository.GetByUserIdAsync(userId);
        var tokensTask = _tokenRepository.GetByUserIdAsync(userId);

        await Task.WhenAll(appointmentsTask, tokensTask);

        var appointments = appointmentsTask.Result;
        var tokens = tokensTask.Result.ToDictionary(t => t.AppointmentId ?? -1);
        
        return appointments.Select(a => {
            tokens.TryGetValue(a.AppointmentId, out var linkedToken);
            return new AppointmentResponseDto
            {
                AppointmentId = a.AppointmentId,
                CenterId = a.CenterId,
                UserId = a.UserId,
                TokenId = linkedToken?.TokenId,
                TokenNumber = linkedToken?.TokenNumber ?? string.Empty,
                AppointmentDate = a.AppointmentDate,
                AppointmentTime = a.AppointmentTime,
                Status = a.Status,
                CreatedAt = a.CreatedAt
            };
        });
    }
}
