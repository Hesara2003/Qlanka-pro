# Summary

|||
|:---|:---|
| Generated on: | 3/24/2026 - 12:52:51 PM |
| Coverage date: | 3/24/2026 - 12:52:11 PM |
| Parser: | Cobertura |
| Assemblies: | 3 |
| Classes: | 148 |
| Files: | 120 |
| **Line coverage:** | 25.2% (1341 of 5303) |
| Covered lines: | 1341 |
| Uncovered lines: | 3962 |
| Coverable lines: | 5303 |
| Total lines: | 9561 |
| **Branch coverage:** | 9.7% (158 of 1626) |
| Covered branches: | 158 |
| Total branches: | 1626 |
| **Method coverage:** | [Feature is only available for sponsors](https://reportgenerator.io/pro) |

# Risk Hotspots

| **Assembly** | **Class** | **Method** | **Crap Score** | **Cyclomatic complexity** |
|:---|:---|:---|---:|---:|
| QueueLanka.Queue | QueueLanka.Queue.Data.CounterRepository | ReassignTokenAsync() | 4692 | 68 || QueueLanka.Queue | QueueLanka.Queue.Services.AppointmentService | BookTokenAsync() | 3906 | 62 || QueueLanka.API | QueueLanka.API.Services.AppointmentService | BookTokenAsync() | 2352 | 48 || QueueLanka.Queue | QueueLanka.Queue.Data.CounterRepository | UpdateTokenStatusAsync() | 2162 | 46 || QueueLanka.API | QueueLanka.API.Services.ServiceCenterService | CreateServiceCenterAsync() | 1980 | 44 || QueueLanka.API | QueueLanka.API.Data.ServiceCenterRepository | MapServiceCenter(...) | 930 | 30 || QueueLanka.API | QueueLanka.API.Services.TokenService | GetUserTokensAsync() | 930 | 30 || QueueLanka.Queue | QueueLanka.Queue.Data.CounterRepository | GetCounterDashboardAsync() | 930 | 30 || QueueLanka.Queue | QueueLanka.Queue.Services.TokenService | GetUserTokensAsync() | 930 | 30 || QueueLanka.API | QueueLanka.API.Data.ServiceCenterRepository | MapLocation(...) | 506 | 22 || QueueLanka.API | QueueLanka.API.Data.ServiceCenterRepository | UpsertLocationCoreAsync() | 506 | 22 || QueueLanka.Queue | Program | IsAllowedCorsOrigin() | 506 | 22 || QueueLanka.API | QueueLanka.API.Data.ServiceCenterRepository | CreateAsync() | 420 | 20 || QueueLanka.API | QueueLanka.API.Services.ServiceCenterService | UpsertLocationAsync() | 420 | 20 || QueueLanka.Queue | QueueLanka.Queue.Services.TokenService | CancelTokenAsync() | 420 | 20 || QueueLanka.API | QueueLanka.API.Data.UserRepository | MapUser(...) | 342 | 18 || QueueLanka.Queue | QueueLanka.Queue.Data.CounterRepository | MapToken(...) | 342 | 18 || QueueLanka.Queue | QueueLanka.Queue.Data.CounterRepository | CallNextTokenAsync() | 342 | 18 || QueueLanka.API | QueueLanka.API.Data.ServiceCenterRepository | GetAvailabilityForDateAsync() | 272 | 16 || QueueLanka.API | QueueLanka.API.Data.TokenRepository | MapToken(...) | 272 | 16 || QueueLanka.API | QueueLanka.API.Data.TokenRepository | CreateAsync() | 272 | 16 || QueueLanka.API | QueueLanka.API.Data.UserRepository | GetAllAsync() | 272 | 16 || QueueLanka.API | QueueLanka.API.Middleware.ExceptionMiddleware | WriteErrorResponseAsync() | 272 | 16 || QueueLanka.Queue | QueueLanka.Queue.Data.CounterRepository | CreateCounterAsync() | 272 | 16 || QueueLanka.Queue | QueueLanka.Queue.Data.TokenRepository | MapToken(...) | 272 | 16 || QueueLanka.Queue | QueueLanka.Queue.Data.TokenRepository | CreateAsync() | 272 | 16 || QueueLanka.Queue | QueueLanka.Queue.DTOs.Reports.DateRangeAttribute | IsValid(...) | 272 | 16 || QueueLanka.Shared | QueueLanka.Shared.Middleware.ExceptionMiddleware | WriteErrorResponseAsync() | 272 | 16 || QueueLanka.API | QueueLanka.API.Services.SmtpEmailService | SendAsync() | 210 | 14 || QueueLanka.Queue | QueueLanka.Queue.Data.ReportRepository | GetDailyCenterSummaryAsync() | 210 | 14 || QueueLanka.Queue | QueueLanka.Queue.Controllers.TokenController | CancelMyToken() | 182 | 13 || QueueLanka.API | QueueLanka.API.Data.AppointmentRepository | BookAtomicAsync() | 156 | 12 || QueueLanka.API | QueueLanka.API.Data.ServiceCenterRepository | GetOperatingDaysAsync() | 156 | 12 || QueueLanka.API | QueueLanka.API.Data.UserRepository | AddAuditLogAsync() | 156 | 12 || QueueLanka.API | QueueLanka.API.Services.AuthService | RegisterAsync() | 156 | 12 || QueueLanka.API | QueueLanka.API.Services.TokenService | CancelTokenAsync() | 156 | 12 || QueueLanka.Queue | QueueLanka.Queue.Data.AppointmentRepository | BookAtomicAsync() | 156 | 12 || QueueLanka.Queue | QueueLanka.Queue.Data.CounterRepository | GetCounterQueueStateAsync() | 156 | 12 || QueueLanka.API | QueueLanka.API.Data.EmailVerificationRepository | GetValidByTokenAsync() | 110 | 10 || QueueLanka.API | QueueLanka.API.Services.ServiceCenterService | MapToDto(...) | 110 | 10 || QueueLanka.Queue | QueueLanka.Queue.Data.CounterRepository | UpdateCounterStatusAsync() | 110 | 10 || QueueLanka.API | QueueLanka.API.Data.AppointmentRepository | GetByIdAsync() | 72 | 8 || QueueLanka.API | QueueLanka.API.Data.AppointmentRepository | GetByUserIdAsync() | 72 | 8 || QueueLanka.API | QueueLanka.API.Data.ServiceCenterRepository | GetAllAsync() | 72 | 8 || QueueLanka.API | QueueLanka.API.Data.ServiceCenterRepository | GetByIdAsync() | 72 | 8 || QueueLanka.API | QueueLanka.API.Data.ServiceCenterRepository | GetLocationAsync() | 72 | 8 || QueueLanka.API | QueueLanka.API.Data.TokenRepository | GetByCenterAndDateAsync() | 72 | 8 || QueueLanka.API | QueueLanka.API.Data.TokenRepository | GetByIdAsync() | 72 | 8 || QueueLanka.API | QueueLanka.API.Data.TokenRepository | GetByNumberDateCenterAsync() | 72 | 8 || QueueLanka.API | QueueLanka.API.Data.TokenRepository | GetByUserIdAsync() | 72 | 8 || QueueLanka.API | QueueLanka.API.Data.UserRepository | GetByEmailAsync() | 72 | 8 || QueueLanka.API | QueueLanka.API.Data.UserRepository | GetByIdAsync() | 72 | 8 || QueueLanka.API | QueueLanka.API.Data.UserRepository | GetByUsernameAsync() | 72 | 8 || QueueLanka.API | QueueLanka.API.Services.UserManagementService | DeleteUserAsync() | 72 | 8 || QueueLanka.Queue | QueueLanka.Queue.Data.AppointmentRepository | GetByIdAsync() | 72 | 8 || QueueLanka.Queue | QueueLanka.Queue.Data.AppointmentRepository | GetByUserIdAsync() | 72 | 8 || QueueLanka.Queue | QueueLanka.Queue.Data.CounterRepository | GetAverageServiceTimeAsync() | 72 | 8 || QueueLanka.Queue | QueueLanka.Queue.Data.CounterRepository | GetCounterByIdAsync() | 72 | 8 || QueueLanka.Queue | QueueLanka.Queue.Data.CounterRepository | GetCountersByCenterAsync() | 72 | 8 || QueueLanka.Queue | QueueLanka.Queue.Data.CounterRepository | GetServedCountTodayAsync() | 72 | 8 || QueueLanka.Queue | QueueLanka.Queue.Data.CounterRepository | GetSkippedCountTodayAsync() | 72 | 8 || QueueLanka.Queue | QueueLanka.Queue.Data.CounterRepository | GetWaitingTokensAsync() | 72 | 8 || QueueLanka.Queue | QueueLanka.Queue.Data.CounterRepository | ResolveTableByColumnsAsync() | 72 | 8 || QueueLanka.Queue | QueueLanka.Queue.Data.TokenRepository | GetByCenterAndDateAsync() | 72 | 8 || QueueLanka.Queue | QueueLanka.Queue.Data.TokenRepository | GetByIdAsync() | 72 | 8 || QueueLanka.Queue | QueueLanka.Queue.Data.TokenRepository | GetByNumberDateCenterAsync() | 72 | 8 || QueueLanka.Queue | QueueLanka.Queue.Data.TokenRepository | GetByUserIdAsync() | 72 | 8 || QueueLanka.Queue | QueueLanka.Queue.Hubs.QueueHub | OnDisconnectedAsync() | 72 | 8 || QueueLanka.Queue | QueueLanka.Queue.Integration.ServiceCenterClient | GetCentersAsync() | 72 | 8 || QueueLanka.Shared | QueueLanka.Shared.Events.InMemoryEventBus | PublishAsync() | 72 | 8 || QueueLanka.API | QueueLanka.API.Data.ServiceCenterRepository | IsCenterAvailableAsync() | 42 | 6 || QueueLanka.API | QueueLanka.API.Data.TokenRepository | CancelAndShiftQueueAsync() | 42 | 6 || QueueLanka.API | QueueLanka.API.Data.UserRepository | CreateAsync() | 42 | 6 || QueueLanka.API | QueueLanka.API.Data.UserRepository | SoftDeleteAsync() | 42 | 6 || QueueLanka.API | QueueLanka.API.Filters.ValidationFilter | OnActionExecuting(...) | 42 | 6 || QueueLanka.API | QueueLanka.API.Services.AuthService | LoginAsync() | 42 | 6 || QueueLanka.API | QueueLanka.API.Services.ServiceCenterService | GetAllServiceCentersAsync() | 42 | 6 || QueueLanka.API | QueueLanka.API.Services.ServiceCenterService | GetLocationAsync() | 42 | 6 || QueueLanka.API | QueueLanka.API.Services.ServiceCenterService | GetServiceCenterByIdAsync() | 42 | 6 || QueueLanka.API | QueueLanka.API.Services.UserManagementService | GetUsersAsync() | 42 | 6 || QueueLanka.Queue | QueueLanka.Queue.Controllers.AppointmentController | BookToken() | 42 | 6 || QueueLanka.Queue | QueueLanka.Queue.Controllers.AppointmentController | GetMyAppointments() | 42 | 6 || QueueLanka.Queue | QueueLanka.Queue.Controllers.CounterController | GetCounterStats() | 42 | 6 || QueueLanka.Queue | QueueLanka.Queue.Controllers.ReportsController | GetCenterSummaryCsv() | 42 | 6 || QueueLanka.Queue | QueueLanka.Queue.Controllers.ReportsController | GetDailySummaryCsv() | 42 | 6 || QueueLanka.Queue | QueueLanka.Queue.Controllers.TokenController | GetMyTokens() | 42 | 6 || QueueLanka.Queue | QueueLanka.Queue.Data.CounterRepository | MapCounterResponse(...) | 42 | 6 || QueueLanka.Queue | QueueLanka.Queue.Data.CounterRepository | ResolveExistingTableAsync() | 42 | 6 || QueueLanka.Queue | QueueLanka.Queue.Data.TokenRepository | CancelAndShiftQueueAsync() | 42 | 6 || QueueLanka.Queue | QueueLanka.Queue.Hubs.QueueHub | OnConnectedAsync() | 42 | 6 || QueueLanka.Shared | QueueLanka.Shared.Filters.ValidationFilter | OnActionExecuting(...) | 32 | 6 || QueueLanka.Queue | QueueLanka.Queue.Services.CounterService | ReassignTokenAsync() | 30 | 22 || QueueLanka.Queue | Program | <Main>$(...) | 16 | 16 || QueueLanka.Queue | QueueLanka.Queue.Services.CounterService | UpdateTokenStatusAsync() | 20 | 16 |
# Coverage

| **Name** | **Covered** | **Uncovered** | **Coverable** | **Total** | **Line coverage** | **Covered** | **Total** | **Branch coverage** |
|:---|---:|---:|---:|---:|---:|---:|---:|---:|
| **QueueLanka.API** | **395** | **1816** | **2211** | **4993** | **17.8%** | **60** | **753** | **7.9%** |
| Program | 0 | 112 | 112 | 145 | 0% | 0 | 4 | 0% |
| QueueLanka.API.Controllers.AdminUserController | 47 | 0 | 47 | 122 | 100% | 6 | 6 | 100% |
| QueueLanka.API.Controllers.AppointmentController | 57 | 0 | 57 | 107 | 100% | 12 | 12 | 100% |
| QueueLanka.API.Controllers.AuthController | 26 | 0 | 26 | 77 | 100% | 6 | 6 | 100% |
| QueueLanka.API.Controllers.ServiceCenterController | 97 | 0 | 97 | 254 | 100% | 16 | 16 | 100% |
| QueueLanka.API.Controllers.TokenController | 47 | 0 | 47 | 81 | 100% | 18 | 19 | 94.7% |
| QueueLanka.API.Data.AppointmentRepository | 0 | 85 | 85 | 155 | 0% | 0 | 40 | 0% |
| QueueLanka.API.Data.EmailVerificationRepository | 0 | 39 | 39 | 76 | 0% | 0 | 20 | 0% |
| QueueLanka.API.Data.ServiceCenterRepository | 0 | 256 | 256 | 446 | 0% | 0 | 156 | 0% |
| QueueLanka.API.Data.TokenRepository | 0 | 132 | 132 | 220 | 0% | 0 | 84 | 0% |
| QueueLanka.API.Data.UserRepository | 0 | 134 | 134 | 247 | 0% | 0 | 104 | 0% |
| QueueLanka.API.DTOs.Appointment.AppointmentResponseDto | 5 | 4 | 9 | 14 | 55.5% | 0 | 0 |  |
| QueueLanka.API.DTOs.Appointment.BookAppointmentRequestDto | 3 | 0 | 3 | 15 | 100% | 0 | 0 |  |
| QueueLanka.API.DTOs.Auth.LoginRequestDto | 2 | 0 | 2 | 12 | 100% | 0 | 0 |  |
| QueueLanka.API.DTOs.Auth.LoginResponseDto | 4 | 1 | 5 | 10 | 80% | 0 | 0 |  |
| QueueLanka.API.DTOs.Auth.RegisterRequestDto | 4 | 1 | 5 | 29 | 80% | 0 | 0 |  |
| QueueLanka.API.DTOs.Auth.RegisterResponseDto | 3 | 0 | 3 | 8 | 100% | 0 | 0 |  |
| QueueLanka.API.DTOs.Auth.VerifyEmailResponseDto | 1 | 0 | 1 | 6 | 100% | 0 | 0 |  |
| QueueLanka.API.DTOs.Common.ApiResponse<T> | 10 | 6 | 16 | 118 | 62.5% | 0 | 0 |  |
| QueueLanka.API.DTOs.Common.ErrorResponse | 9 | 5 | 14 | 118 | 64.2% | 0 | 0 |  |
| QueueLanka.API.DTOs.Common.ResponseMetadata | 3 | 2 | 5 | 118 | 60% | 0 | 0 |  |
| QueueLanka.API.DTOs.Common.ValidationError | 0 | 10 | 10 | 118 | 0% | 0 | 0 |  |
| QueueLanka.API.DTOs.ServiceCenter.CenterLocationDto | 3 | 8 | 11 | 26 | 27.2% | 0 | 0 |  |
| QueueLanka.API.DTOs.ServiceCenter.CreateServiceCenterRequestDto | 9 | 12 | 21 | 106 | 42.8% | 0 | 0 |  |
| QueueLanka.API.DTOs.ServiceCenter.ServiceCenterDto | 9 | 6 | 15 | 24 | 60% | 0 | 0 |  |
| QueueLanka.API.DTOs.ServiceCenter.UpsertLocationRequestDto | 2 | 8 | 10 | 43 | 20% | 0 | 0 |  |
| QueueLanka.API.DTOs.Token.UserTokenResponseDto | 4 | 8 | 12 | 17 | 33.3% | 0 | 0 |  |
| QueueLanka.API.DTOs.User.AdminUserDto | 5 | 6 | 11 | 20 | 45.4% | 0 | 0 |  |
| QueueLanka.API.Exceptions.AccountDisabledException | 1 | 0 | 1 | 7 | 100% | 0 | 0 |  |
| QueueLanka.API.Exceptions.AppException | 5 | 2 | 7 | 14 | 71.4% | 0 | 0 |  |
| QueueLanka.API.Exceptions.CannotDeleteAdminException | 1 | 0 | 1 | 30 | 100% | 0 | 0 |  |
| QueueLanka.API.Exceptions.CenterFullException | 3 | 0 | 3 | 23 | 100% | 0 | 0 |  |
| QueueLanka.API.Exceptions.DataAccessException | 3 | 0 | 3 | 75 | 100% | 0 | 0 |  |
| QueueLanka.API.Exceptions.DuplicateBookingException | 3 | 0 | 3 | 23 | 100% | 0 | 0 |  |
| QueueLanka.API.Exceptions.DuplicateEmailException | 1 | 0 | 1 | 7 | 100% | 0 | 0 |  |
| QueueLanka.API.Exceptions.DuplicateServiceCenterException | 4 | 0 | 4 | 75 | 100% | 0 | 0 |  |
| QueueLanka.API.Exceptions.DuplicateUsernameException | 1 | 0 | 1 | 7 | 100% | 0 | 0 |  |
| QueueLanka.API.Exceptions.EmailNotVerifiedException | 0 | 2 | 2 | 9 | 0% | 0 | 0 |  |
| QueueLanka.API.Exceptions.InvalidCredentialsException | 1 | 0 | 1 | 7 | 100% | 0 | 0 |  |
| QueueLanka.API.Exceptions.InvalidServiceCenterDataException | 3 | 0 | 3 | 75 | 100% | 0 | 0 |  |
| QueueLanka.API.Exceptions.InvalidUserIdException | 1 | 0 | 1 | 30 | 100% | 0 | 0 |  |
| QueueLanka.API.Exceptions.InvalidUserRoleFilterException | 2 | 0 | 2 | 30 | 100% | 0 | 0 |  |
| QueueLanka.API.Exceptions.InvalidVerificationTokenException | 2 | 0 | 2 | 9 | 100% | 0 | 0 |  |
| QueueLanka.API.Exceptions.LocationNotFoundException | 4 | 0 | 4 | 75 | 100% | 0 | 0 |  |
| QueueLanka.API.Exceptions.ServiceCenterNotFoundException | 4 | 1 | 5 | 75 | 80% | 0 | 0 |  |
| QueueLanka.API.Exceptions.ServiceCenterUnavailableException | 0 | 5 | 5 | 75 | 0% | 0 | 0 |  |
| QueueLanka.API.Exceptions.UserNotFoundException | 1 | 0 | 1 | 30 | 100% | 0 | 0 |  |
| QueueLanka.API.Extensions.ClaimsPrincipalExtensions | 5 | 8 | 13 | 39 | 38.4% | 2 | 12 | 16.6% |
| QueueLanka.API.Filters.ValidationFilter | 0 | 30 | 30 | 49 | 0% | 0 | 6 | 0% |
| QueueLanka.API.Middleware.ExceptionMiddleware | 0 | 71 | 71 | 106 | 0% | 0 | 16 | 0% |
| QueueLanka.API.Middleware.JwtMiddleware | 0 | 57 | 57 | 101 | 0% | 0 | 8 | 0% |
| QueueLanka.API.Models.Appointment | 0 | 8 | 8 | 13 | 0% | 0 | 0 |  |
| QueueLanka.API.Models.CenterAvailability | 0 | 9 | 9 | 14 | 0% | 0 | 0 |  |
| QueueLanka.API.Models.CenterCapacityLog | 0 | 6 | 6 | 11 | 0% | 0 | 0 |  |
| QueueLanka.API.Models.CenterLocation | 0 | 14 | 14 | 31 | 0% | 0 | 0 |  |
| QueueLanka.API.Models.CenterOperatingDay | 0 | 7 | 7 | 12 | 0% | 0 | 0 |  |
| QueueLanka.API.Models.EmailVerificationToken | 0 | 6 | 6 | 11 | 0% | 0 | 0 |  |
| QueueLanka.API.Models.ServiceCenter | 0 | 15 | 15 | 27 | 0% | 0 | 0 |  |
| QueueLanka.API.Models.Token | 0 | 15 | 15 | 20 | 0% | 0 | 0 |  |
| QueueLanka.API.Models.User | 0 | 14 | 14 | 42 | 0% | 0 | 0 |  |
| QueueLanka.API.Models.UserAuditLog | 0 | 8 | 8 | 44 | 0% | 0 | 0 |  |
| QueueLanka.API.Services.AppointmentService | 0 | 113 | 113 | 171 | 0% | 0 | 56 | 0% |
| QueueLanka.API.Services.AuthService | 0 | 80 | 80 | 139 | 0% | 0 | 20 | 0% |
| QueueLanka.API.Services.EmailVerificationService | 0 | 33 | 33 | 67 | 0% | 0 | 6 | 0% |
| QueueLanka.API.Services.NotificationService | 0 | 24 | 24 | 52 | 0% | 0 | 0 |  |
| QueueLanka.API.Services.ServiceCenterService | 0 | 134 | 134 | 183 | 0% | 0 | 92 | 0% |
| QueueLanka.API.Services.SmtpEmailService | 0 | 177 | 177 | 221 | 0% | 0 | 14 | 0% |
| QueueLanka.API.Services.TokenService | 0 | 77 | 77 | 124 | 0% | 0 | 42 | 0% |
| QueueLanka.API.Services.UserManagementService | 0 | 65 | 65 | 108 | 0% | 0 | 14 | 0% |
| **QueueLanka.Queue** | **890** | **1880** | **2770** | **5082** | **32.1%** | **91** | **819** | **11.1%** |
| Program | 102 | 31 | 133 | 214 | 76.6% | 11 | 38 | 28.9% |
| QueueLanka.Queue.Controllers.AppointmentController | 0 | 57 | 57 | 107 | 0% | 0 | 12 | 0% |
| QueueLanka.Queue.Controllers.CounterController | 33 | 160 | 193 | 400 | 17% | 4 | 24 | 16.6% |
| QueueLanka.Queue.Controllers.ReportsController | 0 | 74 | 74 | 144 | 0% | 0 | 16 | 0% |
| QueueLanka.Queue.Controllers.TokenController | 0 | 35 | 35 | 70 | 0% | 0 | 19 | 0% |
| QueueLanka.Queue.Data.AppointmentRepository | 0 | 86 | 86 | 157 | 0% | 0 | 40 | 0% |
| QueueLanka.Queue.Data.AuditLogRepository | 0 | 25 | 25 | 49 | 0% | 0 | 6 | 0% |
| QueueLanka.Queue.Data.CounterRepository | 0 | 575 | 575 | 1130 | 0% | 0 | 292 | 0% |
| QueueLanka.Queue.Data.ReportRepository | 0 | 95 | 95 | 122 | 0% | 0 | 16 | 0% |
| QueueLanka.Queue.Data.TokenRepository | 0 | 132 | 132 | 220 | 0% | 0 | 84 | 0% |
| QueueLanka.Queue.DTOs.Appointment.AppointmentResponseDto | 0 | 9 | 9 | 14 | 0% | 0 | 0 |  |
| QueueLanka.Queue.DTOs.Appointment.BookAppointmentRequestDto | 0 | 3 | 3 | 15 | 0% | 0 | 0 |  |
| QueueLanka.Queue.DTOs.Counter.CounterDashboardDto | 8 | 0 | 8 | 15 | 100% | 0 | 0 |  |
| QueueLanka.Queue.DTOs.Counter.CounterResponseDto | 10 | 0 | 10 | 17 | 100% | 0 | 0 |  |
| QueueLanka.Queue.DTOs.Counter.CreateCounterRequestDto | 3 | 0 | 3 | 17 | 100% | 0 | 0 |  |
| QueueLanka.Queue.DTOs.Counter.CurrentTokenDto | 5 | 0 | 5 | 12 | 100% | 0 | 0 |  |
| QueueLanka.Queue.DTOs.Counter.ListCountersResponseDto | 5 | 0 | 5 | 12 | 100% | 0 | 0 |  |
| QueueLanka.Queue.DTOs.Counter.UpdateCounterStatusRequestDto | 2 | 0 | 2 | 9 | 100% | 0 | 0 |  |
| QueueLanka.Queue.DTOs.Counter.WaitingTokenDto | 5 | 0 | 5 | 12 | 100% | 0 | 0 |  |
| QueueLanka.Queue.DTOs.Reports.DailyCenterSummaryRequestDto | 4 | 0 | 4 | 70 | 100% | 0 | 0 |  |
| QueueLanka.Queue.DTOs.Reports.DailyCenterSummaryRowDto | 13 | 0 | 13 | 20 | 100% | 0 | 0 |  |
| QueueLanka.Queue.DTOs.Reports.DateRangeAttribute | 0 | 28 | 28 | 70 | 0% | 0 | 16 | 0% |
| QueueLanka.Queue.DTOs.Token.CallNextTokenResponseDto | 9 | 0 | 9 | 16 | 100% | 0 | 0 |  |
| QueueLanka.Queue.DTOs.Token.ReassignTokenRequestDto | 0 | 3 | 3 | 16 | 0% | 0 | 0 |  |
| QueueLanka.Queue.DTOs.Token.ReassignTokenResponseDto | 11 | 0 | 11 | 18 | 100% | 0 | 0 |  |
| QueueLanka.Queue.DTOs.Token.UpdateTokenStatusRequestDto | 0 | 1 | 1 | 12 | 0% | 0 | 0 |  |
| QueueLanka.Queue.DTOs.Token.UpdateTokenStatusResponseDto | 11 | 0 | 11 | 18 | 100% | 0 | 0 |  |
| QueueLanka.Queue.DTOs.Token.UserTokenResponseDto | 0 | 12 | 12 | 17 | 0% | 0 | 0 |  |
| QueueLanka.Queue.Events.CounterStatusEvent | 5 | 0 | 5 | 12 | 100% | 0 | 0 |  |
| QueueLanka.Queue.Events.QueueUpdatedEvent | 8 | 0 | 8 | 17 | 100% | 0 | 0 |  |
| QueueLanka.Queue.Events.TokenCalledEvent | 9 | 0 | 9 | 16 | 100% | 0 | 0 |  |
| QueueLanka.Queue.Events.TokenCancelledEvent | 8 | 0 | 8 | 15 | 100% | 0 | 0 |  |
| QueueLanka.Queue.Events.TokenReassignedEvent | 7 | 0 | 7 | 14 | 100% | 0 | 0 |  |
| QueueLanka.Queue.Events.TokenStatusUpdatedEvent | 8 | 0 | 8 | 15 | 100% | 0 | 0 |  |
| QueueLanka.Queue.Hubs.QueueHub | 2 | 114 | 116 | 184 | 1.7% | 0 | 22 | 0% |
| QueueLanka.Queue.Integration.CenterAvailabilityDto | 0 | 4 | 4 | 46 | 0% | 0 | 0 |  |
| QueueLanka.Queue.Integration.CenterOperatingDayDto | 0 | 4 | 4 | 46 | 0% | 0 | 0 |  |
| QueueLanka.Queue.Integration.ServiceCenterClient | 0 | 50 | 50 | 86 | 0% | 0 | 10 | 0% |
| QueueLanka.Queue.Integration.ServiceCenterDto | 2 | 7 | 9 | 46 | 22.2% | 0 | 0 |  |
| QueueLanka.Queue.Models.Appointment | 0 | 8 | 8 | 13 | 0% | 0 | 0 |  |
| QueueLanka.Queue.Models.AuditLog | 7 | 1 | 8 | 15 | 87.5% | 0 | 0 |  |
| QueueLanka.Queue.Models.Token | 10 | 6 | 16 | 21 | 62.5% | 0 | 0 |  |
| QueueLanka.Queue.Services.AppointmentService | 0 | 131 | 131 | 198 | 0% | 0 | 68 | 0% |
| QueueLanka.Queue.Services.CounterService | 442 | 87 | 529 | 700 | 83.5% | 67 | 96 | 69.7% |
| QueueLanka.Queue.Services.QueueBroadcastService | 82 | 0 | 82 | 124 | 100% | 0 | 0 |  |
| QueueLanka.Queue.Services.ReportService | 79 | 2 | 81 | 119 | 97.5% | 9 | 10 | 90% |
| QueueLanka.Queue.Services.TokenService | 0 | 125 | 125 | 188 | 0% | 0 | 50 | 0% |
| TokenCalledEventHandler | 0 | 15 | 15 | 214 | 0% | 0 | 0 |  |
| **QueueLanka.Shared** | **56** | **266** | **322** | **1546** | **17.3%** | **7** | **54** | **12.9%** |
| QueueLanka.Shared.DTOs.Common.ApiResponse<T> | 9 | 7 | 16 | 118 | 56.2% | 0 | 0 |  |
| QueueLanka.Shared.DTOs.Common.ErrorResponse | 9 | 5 | 14 | 118 | 64.2% | 0 | 0 |  |
| QueueLanka.Shared.DTOs.Common.ResponseMetadata | 0 | 5 | 5 | 118 | 0% | 0 | 0 |  |
| QueueLanka.Shared.DTOs.Common.ValidationError | 0 | 10 | 10 | 118 | 0% | 0 | 0 |  |
| QueueLanka.Shared.Events.BookingConfirmedEvent | 0 | 10 | 10 | 20 | 0% | 0 | 0 |  |
| QueueLanka.Shared.Events.InMemoryEventBus | 14 | 23 | 37 | 60 | 37.8% | 4 | 12 | 33.3% |
| QueueLanka.Shared.Events.TokenCancelledEvent | 0 | 5 | 5 | 12 | 0% | 0 | 0 |  |
| QueueLanka.Shared.Events.UserRegisteredEvent | 0 | 4 | 4 | 11 | 0% | 0 | 0 |  |
| QueueLanka.Shared.Exceptions.AccountDisabledException | 0 | 1 | 1 | 7 | 0% | 0 | 0 |  |
| QueueLanka.Shared.Exceptions.AppException | 0 | 7 | 7 | 14 | 0% | 0 | 0 |  |
| QueueLanka.Shared.Exceptions.CannotDeleteAdminException | 0 | 1 | 1 | 30 | 0% | 0 | 0 |  |
| QueueLanka.Shared.Exceptions.CenterFullException | 0 | 3 | 3 | 23 | 0% | 0 | 0 |  |
| QueueLanka.Shared.Exceptions.DataAccessException | 0 | 3 | 3 | 75 | 0% | 0 | 0 |  |
| QueueLanka.Shared.Exceptions.DuplicateBookingException | 0 | 3 | 3 | 23 | 0% | 0 | 0 |  |
| QueueLanka.Shared.Exceptions.DuplicateEmailException | 0 | 1 | 1 | 7 | 0% | 0 | 0 |  |
| QueueLanka.Shared.Exceptions.DuplicateServiceCenterException | 0 | 4 | 4 | 75 | 0% | 0 | 0 |  |
| QueueLanka.Shared.Exceptions.DuplicateUsernameException | 0 | 1 | 1 | 7 | 0% | 0 | 0 |  |
| QueueLanka.Shared.Exceptions.EmailNotVerifiedException | 0 | 2 | 2 | 9 | 0% | 0 | 0 |  |
| QueueLanka.Shared.Exceptions.InvalidCredentialsException | 0 | 1 | 1 | 7 | 0% | 0 | 0 |  |
| QueueLanka.Shared.Exceptions.InvalidServiceCenterDataException | 0 | 3 | 3 | 75 | 0% | 0 | 0 |  |
| QueueLanka.Shared.Exceptions.InvalidUserIdException | 0 | 1 | 1 | 30 | 0% | 0 | 0 |  |
| QueueLanka.Shared.Exceptions.InvalidUserRoleFilterException | 0 | 2 | 2 | 30 | 0% | 0 | 0 |  |
| QueueLanka.Shared.Exceptions.InvalidVerificationTokenException | 0 | 2 | 2 | 9 | 0% | 0 | 0 |  |
| QueueLanka.Shared.Exceptions.LocationNotFoundException | 0 | 4 | 4 | 75 | 0% | 0 | 0 |  |
| QueueLanka.Shared.Exceptions.ServiceCenterNotFoundException | 0 | 5 | 5 | 75 | 0% | 0 | 0 |  |
| QueueLanka.Shared.Exceptions.ServiceCenterUnavailableException | 0 | 5 | 5 | 75 | 0% | 0 | 0 |  |
| QueueLanka.Shared.Exceptions.UserNotFoundException | 0 | 1 | 1 | 30 | 0% | 0 | 0 |  |
| QueueLanka.Shared.Extensions.ClaimsPrincipalExtensions | 5 | 8 | 13 | 39 | 38.4% | 2 | 12 | 16.6% |
| QueueLanka.Shared.Filters.ValidationFilter | 5 | 25 | 30 | 49 | 16.6% | 1 | 6 | 16.6% |
| QueueLanka.Shared.Middleware.ExceptionMiddleware | 14 | 57 | 71 | 106 | 19.7% | 0 | 16 | 0% |
| QueueLanka.Shared.Middleware.JwtMiddleware | 0 | 57 | 57 | 101 | 0% | 0 | 8 | 0% |

