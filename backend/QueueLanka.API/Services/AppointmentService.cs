using QueueLanka.API.Data;
using QueueLanka.API.DTOs.Appointment;
using QueueLanka.API.Models;

namespace QueueLanka.API.Services;

public class AppointmentService : IAppointmentService
{
    private readonly IAppointmentRepository _appointmentRepository;
    private readonly IServiceCenterRepository _serviceCenterRepository;
    private readonly ITokenRepository _tokenRepository;
    private readonly IUserRepository _userRepository;
    private readonly INotificationService _notificationService;
    private readonly ILogger<AppointmentService> _logger;

    public AppointmentService(
        IAppointmentRepository appointmentRepository,
        IServiceCenterRepository serviceCenterRepository,
        ITokenRepository tokenRepository,
        IUserRepository userRepository,
        INotificationService notificationService,
        ILogger<AppointmentService> logger)
    {
        _appointmentRepository = appointmentRepository;
        _serviceCenterRepository = serviceCenterRepository;
        _tokenRepository = tokenRepository;
        _userRepository = userRepository;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<AppointmentResponseDto> BookTokenAsync(int userId, BookAppointmentRequestDto requestDto)
    {
        // 1. Validate Service Center exists
        var center = await _serviceCenterRepository.GetByIdAsync(requestDto.CenterId);
        if (center == null || !center.IsActive)
        {
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
        var specificAvailability = await _serviceCenterRepository.GetAvailabilityForDateAsync(center.CenterId, requestedDate);
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
            var operatingDays = await _serviceCenterRepository.GetOperatingDaysAsync(center.CenterId);
            var dayOfWeekStr = requestedDate.DayOfWeek.ToString().ToLower();
            var operatingDay = operatingDays.FirstOrDefault(d => d.DayOfWeek == dayOfWeekStr);

            if (operatingDay == null || !operatingDay.IsOpen)
                throw new InvalidOperationException("Center is closed on this day of the week.");

            var openTime = operatingDay.OpeningTime ?? center.OpeningTime;
            var closeTime = operatingDay.ClosingTime ?? center.ClosingTime;

            if (requestedTime < openTime || requestedTime > closeTime)
                throw new InvalidOperationException($"Requested time is outside operating hours ({openTime} to {closeTime}).");
        }

        // 4. Conflict Resolution: Double Booking
        bool hasConflict = await _appointmentRepository.HasConflictAsync(center.CenterId, requestedDate, requestedTime);
        if (hasConflict)
        {
            throw new InvalidOperationException("This time slot is already booked. Please select another time.");
        }

        // 5. Save the Appointment FIRST
        var appointment = new Appointment
        {
            CenterId = center.CenterId,
            UserId = userId,
            AppointmentDate = requestedDate,
            AppointmentTime = requestedTime,
            Status = "Scheduled"
        };
        var createdAppointment = await _appointmentRepository.CreateAsync(appointment);

        // 6. Generate Unique Token
        // Format: TKN-[CenterId]-[Short Date]-[Random Hex]
        string shortDate = requestedDate.ToString("yyMMdd");
        string randomHex = Guid.NewGuid().ToString("N").Substring(0, 4).ToUpper();
        string tokenNumber = $"TKN-{center.CenterId}-{shortDate}-{randomHex}";

        // 7. Save the Token linked to the Appointment
        var token = new Token
        {
            CenterId = center.CenterId,
            UserId = userId,
            AppointmentId = createdAppointment.AppointmentId,
            TokenNumber = tokenNumber,
            IssuedDate = requestedDate,
            Status = "Waiting",
            IssuedTime = DateTime.UtcNow // Exact time the token was issued
        };
        var createdToken = await _tokenRepository.CreateAsync(token);

        // 8. Dispatch Async Notifications (Fire-And-Forget so we don't block the HTTP Response)
        _ = Task.Run(async () =>
        {
            try
            {
                var user = await _userRepository.GetByIdAsync(userId);
                if (user != null)
                {
                    await _notificationService.SendBookingConfirmationAsync(user, center, createdAppointment, createdToken);
                }
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
