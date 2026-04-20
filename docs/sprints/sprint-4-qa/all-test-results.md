# Sprint 4 Consolidated Test Results (Localhost)

Generated on: 2026-04-20 20:19:32

## Summary
- Total test cases: 201
- Backend test cases (.NET): 165
- Frontend test cases (Vitest): 36
- Passed: 201
- Failed: 0
- Other status: 0

## Sources
- Backend: C:\Users\user\Desktop\Qlanka-pro\backend\QueueLanka.API.Tests\TestResults\api-tests.trx
- Frontend: C:\Users\user\Desktop\Qlanka-pro\frontend\vitest-results.json

## Test Cases
| # | Layer | Framework | Suite | Test Case | Outcome | Duration |
|---:|---|---|---|---|---|---|
| 1 | Backend | .NET xUnit | QueueLanka.API.Tests.AdminUserControllerTests | QueueLanka.API.Tests.AdminUserControllerTests.DeleteUser_NegativeId_ThrowsInvalidUserIdException | Passed | 00:00:00.0033115 |
| 2 | Backend | .NET xUnit | QueueLanka.API.Tests.AdminUserControllerTests | QueueLanka.API.Tests.AdminUserControllerTests.DeleteUser_ServiceThrowsDataAccessException_Throws | Passed | 00:00:00.0266567 |
| 3 | Backend | .NET xUnit | QueueLanka.API.Tests.AdminUserControllerTests | QueueLanka.API.Tests.AdminUserControllerTests.DeleteUser_TargetIsAdmin_ThrowsCannotDeleteAdminException | Passed | 00:00:00.0033956 |
| 4 | Backend | .NET xUnit | QueueLanka.API.Tests.AdminUserControllerTests | QueueLanka.API.Tests.AdminUserControllerTests.DeleteUser_UserNotFound_ThrowsUserNotFoundException | Passed | 00:00:00.0040140 |
| 5 | Backend | .NET xUnit | QueueLanka.API.Tests.AdminUserControllerTests | QueueLanka.API.Tests.AdminUserControllerTests.DeleteUser_ValidId_ReturnsOk | Passed | 00:00:00.0018685 |
| 6 | Backend | .NET xUnit | QueueLanka.API.Tests.AdminUserControllerTests | QueueLanka.API.Tests.AdminUserControllerTests.DeleteUser_ZeroId_ThrowsInvalidUserIdException | Passed | 00:00:00.0017852 |
| 7 | Backend | .NET xUnit | QueueLanka.API.Tests.AdminUserControllerTests | QueueLanka.API.Tests.AdminUserControllerTests.GetUsers_EmptyResult_ReturnsOkWithEmptyList | Passed | 00:00:00.0072135 |
| 8 | Backend | .NET xUnit | QueueLanka.API.Tests.AdminUserControllerTests | QueueLanka.API.Tests.AdminUserControllerTests.GetUsers_InvalidRoleFilter_ThrowsInvalidUserRoleFilterException | Passed | 00:00:00.0029476 |
| 9 | Backend | .NET xUnit | QueueLanka.API.Tests.AdminUserControllerTests | QueueLanka.API.Tests.AdminUserControllerTests.GetUsers_NoFilters_ReturnsOkWithUserList | Passed | 00:00:00.0013051 |
| 10 | Backend | .NET xUnit | QueueLanka.API.Tests.AdminUserControllerTests | QueueLanka.API.Tests.AdminUserControllerTests.GetUsers_ServiceThrowsException_Throws | Passed | 00:00:00.0031222 |
| 11 | Backend | .NET xUnit | QueueLanka.API.Tests.AdminUserControllerTests | QueueLanka.API.Tests.AdminUserControllerTests.GetUsers_WithIsActiveFilter_ReturnsOkWithFilteredList | Passed | 00:00:00.0099293 |
| 12 | Backend | .NET xUnit | QueueLanka.API.Tests.AdminUserControllerTests | QueueLanka.API.Tests.AdminUserControllerTests.GetUsers_WithRoleFilter_ReturnsOkWithFilteredList | Passed | 00:00:00.0022174 |
| 13 | Backend | .NET xUnit | QueueLanka.API.Tests.AppointmentControllerTests | QueueLanka.API.Tests.AppointmentControllerTests.BookToken_ArgumentException_ReturnsNotFound | Passed | 00:00:00.0022858 |
| 14 | Backend | .NET xUnit | QueueLanka.API.Tests.AppointmentControllerTests | QueueLanka.API.Tests.AppointmentControllerTests.BookToken_CenterFullException_Throws | Passed | 00:00:00.0061758 |
| 15 | Backend | .NET xUnit | QueueLanka.API.Tests.AppointmentControllerTests | QueueLanka.API.Tests.AppointmentControllerTests.BookToken_DuplicateBookingException_Throws | Passed | 00:00:00.0035995 |
| 16 | Backend | .NET xUnit | QueueLanka.API.Tests.AppointmentControllerTests | QueueLanka.API.Tests.AppointmentControllerTests.BookToken_InvalidOperationException_ReturnsConflict | Passed | 00:00:00.1226632 |
| 17 | Backend | .NET xUnit | QueueLanka.API.Tests.AppointmentControllerTests | QueueLanka.API.Tests.AppointmentControllerTests.BookToken_UnauthenticatedUser_ReturnsUnauthorized | Passed | 00:00:00.0007803 |
| 18 | Backend | .NET xUnit | QueueLanka.API.Tests.AppointmentControllerTests | QueueLanka.API.Tests.AppointmentControllerTests.BookToken_UnexpectedException_ReturnsStatusCode500 | Passed | 00:00:00.0025171 |
| 19 | Backend | .NET xUnit | QueueLanka.API.Tests.AppointmentControllerTests | QueueLanka.API.Tests.AppointmentControllerTests.BookToken_ValidRequest_ReturnsOk | Passed | 00:00:00.0030785 |
| 20 | Backend | .NET xUnit | QueueLanka.API.Tests.AppointmentControllerTests | QueueLanka.API.Tests.AppointmentControllerTests.GetMyAppointments_AuthenticatedUser_ReturnsOkWithList | Passed | 00:00:00.0044960 |
| 21 | Backend | .NET xUnit | QueueLanka.API.Tests.AppointmentControllerTests | QueueLanka.API.Tests.AppointmentControllerTests.GetMyAppointments_NoAppointments_ReturnsOkWithEmptyList | Passed | 00:00:00.0056061 |
| 22 | Backend | .NET xUnit | QueueLanka.API.Tests.AppointmentControllerTests | QueueLanka.API.Tests.AppointmentControllerTests.GetMyAppointments_UnauthenticatedUser_ReturnsUnauthorized | Passed | 00:00:00.0032737 |
| 23 | Backend | .NET xUnit | QueueLanka.API.Tests.AuthControllerTests | QueueLanka.API.Tests.AuthControllerTests.Login_AccountDisabled_ThrowsAccountDisabledException | Passed | 00:00:00.0034152 |
| 24 | Backend | .NET xUnit | QueueLanka.API.Tests.AuthControllerTests | QueueLanka.API.Tests.AuthControllerTests.Login_InvalidCredentials_ThrowsInvalidCredentialsException | Passed | 00:00:00.0049240 |
| 25 | Backend | .NET xUnit | QueueLanka.API.Tests.AuthControllerTests | QueueLanka.API.Tests.AuthControllerTests.Login_InvalidModelState_ReturnsBadRequest | Passed | 00:00:00.0043500 |
| 26 | Backend | .NET xUnit | QueueLanka.API.Tests.AuthControllerTests | QueueLanka.API.Tests.AuthControllerTests.Login_ValidCredentials_ReturnsOk | Passed | 00:00:00.0045352 |
| 27 | Backend | .NET xUnit | QueueLanka.API.Tests.AuthControllerTests | QueueLanka.API.Tests.AuthControllerTests.Register_DuplicateEmail_ThrowsDuplicateEmailException | Passed | 00:00:00.0035018 |
| 28 | Backend | .NET xUnit | QueueLanka.API.Tests.AuthControllerTests | QueueLanka.API.Tests.AuthControllerTests.Register_DuplicateUsername_ThrowsDuplicateUsernameException | Passed | 00:00:00.0026899 |
| 29 | Backend | .NET xUnit | QueueLanka.API.Tests.AuthControllerTests | QueueLanka.API.Tests.AuthControllerTests.Register_InvalidModelState_ReturnsUnprocessableEntity | Passed | 00:00:00.0008787 |
| 30 | Backend | .NET xUnit | QueueLanka.API.Tests.AuthControllerTests | QueueLanka.API.Tests.AuthControllerTests.Register_ValidRequest_Returns201Created | Passed | 00:00:00.0153364 |
| 31 | Backend | .NET xUnit | QueueLanka.API.Tests.AuthControllerTests | QueueLanka.API.Tests.AuthControllerTests.VerifyEmail_EmptyToken_ReturnsBadRequest | Passed | 00:00:00.0028287 |
| 32 | Backend | .NET xUnit | QueueLanka.API.Tests.AuthControllerTests | QueueLanka.API.Tests.AuthControllerTests.VerifyEmail_InvalidToken_ThrowsInvalidVerificationTokenException | Passed | 00:00:00.0058227 |
| 33 | Backend | .NET xUnit | QueueLanka.API.Tests.AuthControllerTests | QueueLanka.API.Tests.AuthControllerTests.VerifyEmail_ValidToken_ReturnsOk | Passed | 00:00:00.0020758 |
| 34 | Backend | .NET xUnit | QueueLanka.API.Tests.AuthControllerTests | QueueLanka.API.Tests.AuthControllerTests.VerifyEmail_WhitespaceToken_ReturnsBadRequest | Passed | 00:00:00.0013842 |
| 35 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterAuthorizationTests | QueueLanka.API.Tests.CounterAuthorizationTests.AdminJwt_AdminCreateCounter_Returns201Or400_Not401Or403 | Passed | 00:00:00.0567918 |
| 36 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterAuthorizationTests | QueueLanka.API.Tests.CounterAuthorizationTests.CitizenJwt_AdminCreateCounter_Returns403 | Passed | 00:00:00.0023046 |
| 37 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterAuthorizationTests | QueueLanka.API.Tests.CounterAuthorizationTests.CitizenJwt_OfficerDashboard_Returns403 | Passed | 00:00:00.0017532 |
| 38 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterAuthorizationTests | QueueLanka.API.Tests.CounterAuthorizationTests.ExpiredJwt_AnyEndpoint_Returns401 | Passed | 00:00:00.0265317 |
| 39 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterAuthorizationTests | QueueLanka.API.Tests.CounterAuthorizationTests.NoJwt_AdminCreateCounter_Returns401 | Passed | 00:00:00.5115288 |
| 40 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterAuthorizationTests | QueueLanka.API.Tests.CounterAuthorizationTests.NoJwt_OfficerDashboard_Returns401 | Passed | 00:00:00.0022301 |
| 41 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterAuthorizationTests | QueueLanka.API.Tests.CounterAuthorizationTests.OfficerJwt_AdminCreateCounter_Returns403 | Passed | 00:00:00.0247900 |
| 42 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterAuthorizationTests | QueueLanka.API.Tests.CounterAuthorizationTests.OfficerJwt_OfficerDashboard_Returns200Or404 | Passed | 00:00:00.0173655 |
| 43 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterAuthorizationTests | QueueLanka.API.Tests.CounterAuthorizationTests.TamperedJwtSignature_AnyEndpoint_Returns401 | Passed | 00:00:00.0063210 |
| 44 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterControllerTests | QueueLanka.API.Tests.CounterControllerTests.CallNext_CounterClosed_Returns400BadRequest | Passed | 00:00:00.0034640 |
| 45 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterControllerTests | QueueLanka.API.Tests.CounterControllerTests.CallNext_NextTokenFound_ReturnsOkWithTokenDetails | Passed | 00:00:00.1107277 |
| 46 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterControllerTests | QueueLanka.API.Tests.CounterControllerTests.CallNext_NoWaitingTokens_Returns404NotFound | Passed | 00:00:00.0014074 |
| 47 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterDashboardServiceTests | QueueLanka.API.Tests.CounterDashboardServiceTests.GetDashboardAsync_AverageServiceTimeNoData_ReturnsZeroWithoutErrors | Passed | 00:00:00.0024822 |
| 48 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterDashboardServiceTests | QueueLanka.API.Tests.CounterDashboardServiceTests.GetDashboardAsync_CounterNotFound_ThrowsNotFound | Passed | 00:00:00.0069582 |
| 49 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterDashboardServiceTests | QueueLanka.API.Tests.CounterDashboardServiceTests.GetDashboardAsync_NoServedTokensToday_ReturnsZeroServedCount | Passed | 00:00:00.1503029 |
| 50 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterDashboardServiceTests | QueueLanka.API.Tests.CounterDashboardServiceTests.GetDashboardAsync_ValidOfficer_ReturnsDashboardData | Passed | 00:00:00.0042692 |
| 51 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterDashboardServiceTests | QueueLanka.API.Tests.CounterDashboardServiceTests.GetDashboardAsync_WrongOfficer_ThrowsForbidden | Passed | 00:00:00.0282849 |
| 52 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterDashboardServiceTests | QueueLanka.API.Tests.CounterDashboardServiceTests.GetWaitingTokensAsync_NoWaitingTokens_ReturnsEmptyList | Passed | 00:00:00.0097637 |
| 53 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterManagementServiceTests | QueueLanka.API.Tests.CounterManagementServiceTests.BroadcastCalledAfterStatusUpdate_CounterStatusChangedEventFired | Passed | 00:00:00.0025216 |
| 54 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterManagementServiceTests | QueueLanka.API.Tests.CounterManagementServiceTests.BroadcastFailure_StatusUpdateStillSucceeds | Passed | 00:00:00.0044157 |
| 55 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterManagementServiceTests | QueueLanka.API.Tests.CounterManagementServiceTests.CreateCounter_CenterNotFound_ThrowsNotFoundExceptionEquivalent | Passed | 00:00:00.0020388 |
| 56 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterManagementServiceTests | QueueLanka.API.Tests.CounterManagementServiceTests.CreateCounter_DuplicateName_ThrowsConflictExceptionEquivalent | Passed | 00:00:00.0025136 |
| 57 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterManagementServiceTests | QueueLanka.API.Tests.CounterManagementServiceTests.CreateCounter_InvalidOfficerUserId_ThrowsValidationException | Passed | 00:00:00.0064530 |
| 58 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterManagementServiceTests | QueueLanka.API.Tests.CounterManagementServiceTests.CreateCounter_ValidRequest_ReturnsCreatedCounter | Passed | 00:00:00.0185004 |
| 59 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterManagementServiceTests | QueueLanka.API.Tests.CounterManagementServiceTests.ListCounters_CenterNotFound_ThrowsNotFoundExceptionEquivalent | Passed | 00:00:00.0020954 |
| 60 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterManagementServiceTests | QueueLanka.API.Tests.CounterManagementServiceTests.ListCounters_ReturnsCorrectOpenAndClosedCounts | Passed | 00:00:00.0036227 |
| 61 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterManagementServiceTests | QueueLanka.API.Tests.CounterManagementServiceTests.UpdateStatus_CounterNotFound_ThrowsNotFoundExceptionEquivalent | Passed | 00:00:00.0028919 |
| 62 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterManagementServiceTests | QueueLanka.API.Tests.CounterManagementServiceTests.UpdateStatusToClosed_ReturnsUpdatedCounter | Passed | 00:00:00.0279710 |
| 63 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterManagementServiceTests | QueueLanka.API.Tests.CounterManagementServiceTests.UpdateStatusToClosedWithWaitingTokens_SucceedsWithWarningMessage | Passed | 00:00:00.0020352 |
| 64 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterManagementServiceTests | QueueLanka.API.Tests.CounterManagementServiceTests.UpdateStatusToOpen_ReturnsUpdatedCounter | Passed | 00:00:00.0022644 |
| 65 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterServiceBroadcastTests | QueueLanka.API.Tests.CounterServiceBroadcastTests.CallNext_BroadcastsQueueUpdated_WithTokenCalledTriggerAndWaitingList | Passed | 00:00:00.0081160 |
| 66 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterServiceBroadcastTests | QueueLanka.API.Tests.CounterServiceBroadcastTests.CounterStatusChange_BroadcastsToCenterGroup | Passed | 00:00:00.0048313 |
| 67 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterServiceBroadcastTests | QueueLanka.API.Tests.CounterServiceBroadcastTests.QueueBroadcastFailure_DoesNotBreakSuccessfulDbOperation | Passed | 00:00:00.0221536 |
| 68 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterServiceBroadcastTests | QueueLanka.API.Tests.CounterServiceBroadcastTests.ReassignToken_BroadcastsQueueUpdated_ForSourceAndDestinationCounters | Passed | 00:00:00.0153242 |
| 69 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterServiceBroadcastTests | QueueLanka.API.Tests.CounterServiceBroadcastTests.ServeToken_BroadcastsQueueUpdated_WithUpdatedServedCount | Passed | 00:00:00.0382206 |
| 70 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterServiceBroadcastTests | QueueLanka.API.Tests.CounterServiceBroadcastTests.SkipToken_BroadcastsQueueUpdated_WithUpdatedSkippedCount | Passed | 00:00:00.0101830 |
| 71 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterServiceReassignTests | QueueLanka.API.Tests.CounterServiceReassignTests.ReassignToken_AuditLogFailure_ReassignmentStillSucceeds | Passed | 00:00:00.0022873 |
| 72 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterServiceReassignTests | QueueLanka.API.Tests.CounterServiceReassignTests.ReassignToken_BroadcastFailure_ReassignmentStillSucceeds | Passed | 00:00:00.0036102 |
| 73 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterServiceReassignTests | QueueLanka.API.Tests.CounterServiceReassignTests.ReassignToken_TargetCounterClosed_ThrowsValidationException | Passed | 00:00:00.0054864 |
| 74 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterServiceReassignTests | QueueLanka.API.Tests.CounterServiceReassignTests.ReassignToken_TokenAlreadyServed_ThrowsValidationException | Passed | 00:00:00.1302208 |
| 75 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterServiceReassignTests | QueueLanka.API.Tests.CounterServiceReassignTests.ReassignToken_TokenNotFound_ThrowsNotFoundException | Passed | 00:00:00.0026656 |
| 76 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterServiceReassignTests | QueueLanka.API.Tests.CounterServiceReassignTests.ReassignToken_ValidRequest_MovesTokenPublishesAndAuditLogs | Passed | 00:00:00.0539033 |
| 77 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterServiceUpdateStatusTests | QueueLanka.API.Tests.CounterServiceUpdateStatusTests.UpdateTokenStatus_InvalidStatus_ThrowsValidationException | Passed | 00:00:00.0194550 |
| 78 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterServiceUpdateStatusTests | QueueLanka.API.Tests.CounterServiceUpdateStatusTests.UpdateTokenStatus_TokenNotFound_ThrowsNotFoundException | Passed | 00:00:00.0029734 |
| 79 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterServiceUpdateStatusTests | QueueLanka.API.Tests.CounterServiceUpdateStatusTests.UpdateTokenStatus_TokenNotInCalledState_ThrowsAppropriateException | Passed | 00:00:00.0025649 |
| 80 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterServiceUpdateStatusTests | QueueLanka.API.Tests.CounterServiceUpdateStatusTests.UpdateTokenStatus_ValidServedUpdate_ReturnsUpdatedTokenAndPublishesEvent | Passed | 00:00:00.0029991 |
| 81 | Backend | .NET xUnit | QueueLanka.API.Tests.CounterServiceUpdateStatusTests | QueueLanka.API.Tests.CounterServiceUpdateStatusTests.UpdateTokenStatus_ValidSkippedUpdate_ReturnsUpdatedTokenAndPublishesEvent | Passed | 00:00:00.1544148 |
| 82 | Backend | .NET xUnit | QueueLanka.API.Tests.QueueApiConsistencyAndPerformanceTests | QueueLanka.API.Tests.QueueApiConsistencyAndPerformanceTests.DashboardStatsAndReportCsv_ShouldExposeConsistentServedAndSkippedCounts | Passed | 00:00:00.0077641 |
| 83 | Backend | .NET xUnit | QueueLanka.API.Tests.QueueApiConsistencyAndPerformanceTests | QueueLanka.API.Tests.QueueApiConsistencyAndPerformanceTests.ReportEndpoint_P95Latency_ShouldStayUnder250Ms | Passed | 00:00:00.0520918 |
| 84 | Backend | .NET xUnit | QueueLanka.API.Tests.QueueApiConsistencyAndPerformanceTests | QueueLanka.API.Tests.QueueApiConsistencyAndPerformanceTests.StatsEndpoint_P95Latency_ShouldStayUnder200Ms | Passed | 00:00:00.0904675 |
| 85 | Backend | .NET xUnit | QueueLanka.API.Tests.QueueApiConsistencyAndPerformanceTests | QueueLanka.API.Tests.QueueApiConsistencyAndPerformanceTests.StatsEndpoint_ShouldReturnSecurityHeaders | Passed | 00:00:00.7374935 |
| 86 | Backend | .NET xUnit | QueueLanka.API.Tests.QueueBroadcastServiceTests | QueueLanka.API.Tests.QueueBroadcastServiceTests.AllEventTypes_BroadcastToCorrectGroupScope | Passed | 00:00:00.0034663 |
| 87 | Backend | .NET xUnit | QueueLanka.API.Tests.QueueBroadcastServiceTests | QueueLanka.API.Tests.QueueBroadcastServiceTests.BroadcastTokenCalled_SendsToCorrectQueueCenterGroup | Passed | 00:00:00.0028335 |
| 88 | Backend | .NET xUnit | QueueLanka.API.Tests.QueueBroadcastServiceTests | QueueLanka.API.Tests.QueueBroadcastServiceTests.BroadcastTokenCancelled_SendsToCorrectGroupWithCancelledPayload | Passed | 00:00:00.0191947 |
| 89 | Backend | .NET xUnit | QueueLanka.API.Tests.QueueBroadcastServiceTests | QueueLanka.API.Tests.QueueBroadcastServiceTests.BroadcastTokenServed_SendsToCorrectGroupWithServedPayload | Passed | 00:00:00.1449949 |
| 90 | Backend | .NET xUnit | QueueLanka.API.Tests.QueueBroadcastServiceTests | QueueLanka.API.Tests.QueueBroadcastServiceTests.BroadcastTokenSkipped_SendsToCorrectGroupWithSkippedPayload | Passed | 00:00:00.0039467 |
| 91 | Backend | .NET xUnit | QueueLanka.API.Tests.QueueBroadcastServiceTests | QueueLanka.API.Tests.QueueBroadcastServiceTests.HubThrowsException_BroadcastServiceCatchesSilently_DoesNotPropagate | Passed | 00:00:00.0095363 |
| 92 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportCsvValidationTests | QueueLanka.API.Tests.ReportCsvValidationTests.GenerateDailyCenterSummaryCsvAsync_ActiveCounters_MatchesDistinctServedCounters | Passed | 00:00:00.0009474 |
| 93 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportCsvValidationTests | QueueLanka.API.Tests.ReportCsvValidationTests.GenerateDailyCenterSummaryCsvAsync_AverageServiceTime_MatchesManualCalculationInMinutes | Passed | 00:00:00.0019049 |
| 94 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportCsvValidationTests | QueueLanka.API.Tests.ReportCsvValidationTests.GenerateDailyCenterSummaryCsvAsync_AverageWaitTime_MatchesManualCalculationInMinutes | Passed | 00:00:00.0011578 |
| 95 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportCsvValidationTests | QueueLanka.API.Tests.ReportCsvValidationTests.GenerateDailyCenterSummaryCsvAsync_CenterFilter_ExcludesOtherCenters | Passed | 00:00:00.0025010 |
| 96 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportCsvValidationTests | QueueLanka.API.Tests.ReportCsvValidationTests.GenerateDailyCenterSummaryCsvAsync_CenterNameWithComma_IsQuotedCorrectly | Passed | 00:00:00.0018379 |
| 97 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportCsvValidationTests | QueueLanka.API.Tests.ReportCsvValidationTests.GenerateDailyCenterSummaryCsvAsync_CsvBom_IsUtf8Bom | Passed | 00:00:00.1231417 |
| 98 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportCsvValidationTests | QueueLanka.API.Tests.ReportCsvValidationTests.GenerateDailyCenterSummaryCsvAsync_CsvHeaders_MatchExpectedColumns | Passed | 00:00:00.0031300 |
| 99 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportCsvValidationTests | QueueLanka.API.Tests.ReportCsvValidationTests.GenerateDailyCenterSummaryCsvAsync_DateRangeFilter_ExcludesOutsideTokens | Passed | 00:00:00.0056917 |
| 100 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportCsvValidationTests | QueueLanka.API.Tests.ReportCsvValidationTests.GenerateDailyCenterSummaryCsvAsync_EmptyDateRange_ReturnsHeadersOnly | Passed | 00:00:00.0058362 |
| 101 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportCsvValidationTests | QueueLanka.API.Tests.ReportCsvValidationTests.GenerateDailyCenterSummaryCsvAsync_MultipleCenterFilter_IncludesOnlySpecifiedCenters | Passed | 00:00:00.0709140 |
| 102 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportCsvValidationTests | QueueLanka.API.Tests.ReportCsvValidationTests.GenerateDailyCenterSummaryCsvAsync_NoShowCount_MatchesWaitingAndCalledAtEndOfDay | Passed | 00:00:00.0026551 |
| 103 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportCsvValidationTests | QueueLanka.API.Tests.ReportCsvValidationTests.GenerateDailyCenterSummaryCsvAsync_PeakHour_UsesHighestIssuedHour | Passed | 00:00:00.0015816 |
| 104 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportCsvValidationTests | QueueLanka.API.Tests.ReportCsvValidationTests.GenerateDailyCenterSummaryCsvAsync_PeakHourTokenCount_MatchesExpectedAggregate | Passed | 00:00:00.0008879 |
| 105 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportCsvValidationTests | QueueLanka.API.Tests.ReportCsvValidationTests.GenerateDailyCenterSummaryCsvAsync_SingleCenterFilter_ContainsOnlySingleCenterData | Passed | 00:00:00.0011405 |
| 106 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportCsvValidationTests | QueueLanka.API.Tests.ReportCsvValidationTests.GenerateDailyCenterSummaryCsvAsync_SummaryRowTotals_MatchSumOfDataRows | Passed | 00:00:00.0014633 |
| 107 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportCsvValidationTests | QueueLanka.API.Tests.ReportCsvValidationTests.GenerateDailyCenterSummaryCsvAsync_TotalCancelled_MatchesExpectedAggregate | Passed | 00:00:00.0031344 |
| 108 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportCsvValidationTests | QueueLanka.API.Tests.ReportCsvValidationTests.GenerateDailyCenterSummaryCsvAsync_TotalServed_MatchesExpectedAggregate | Passed | 00:00:00.0026264 |
| 109 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportCsvValidationTests | QueueLanka.API.Tests.ReportCsvValidationTests.GenerateDailyCenterSummaryCsvAsync_TotalSkipped_MatchesExpectedAggregate | Passed | 00:00:00.0008069 |
| 110 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportCsvValidationTests | QueueLanka.API.Tests.ReportCsvValidationTests.GenerateDailyCenterSummaryCsvAsync_TotalTokensIssued_MatchesExpectedAggregate | Passed | 00:00:00.0048816 |
| 111 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportCsvValidationTests | QueueLanka.API.Tests.ReportCsvValidationTests.GenerateDailyCenterSummaryCsvAsync_ZeroAverageWaitTime_DisplaysAsZeroPointZero | Passed | 00:00:00.0008989 |
| 112 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportRepositoryIntegrationTests | QueueLanka.API.Tests.ReportRepositoryIntegrationTests.GetDailyCenterSummaryAsync_AverageWaitTimeSeconds_MatchesManualCalculation | Passed | 00:00:00.0010020 |
| 113 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportRepositoryIntegrationTests | QueueLanka.API.Tests.ReportRepositoryIntegrationTests.GetDailyCenterSummaryAsync_CenterFilter_ExcludesOtherCenters | Passed | 00:00:00.0008126 |
| 114 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportRepositoryIntegrationTests | QueueLanka.API.Tests.ReportRepositoryIntegrationTests.GetDailyCenterSummaryAsync_DateRange_ReturnsCorrectRowCount | Passed | 00:00:00.0039956 |
| 115 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportRepositoryIntegrationTests | QueueLanka.API.Tests.ReportRepositoryIntegrationTests.GetDailyCenterSummaryAsync_DateRangeFilter_ExcludesOutsideRange | Passed | 00:00:00.0005996 |
| 116 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportRepositoryIntegrationTests | QueueLanka.API.Tests.ReportRepositoryIntegrationTests.GetDailyCenterSummaryAsync_EmptyResult_ReturnsEmptyListNotNull | Passed | 00:00:00.0008354 |
| 117 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportRepositoryIntegrationTests | QueueLanka.API.Tests.ReportRepositoryIntegrationTests.GetDailyCenterSummaryAsync_MultipleCenters_ReturnsPerCenterPerDayRows | Passed | 00:00:00.0020873 |
| 118 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportRepositoryIntegrationTests | QueueLanka.API.Tests.ReportRepositoryIntegrationTests.GetDailyCenterSummaryAsync_PeakHour_MatchesSeededPeakHour | Passed | 00:00:00.0006194 |
| 119 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportRepositoryIntegrationTests | QueueLanka.API.Tests.ReportRepositoryIntegrationTests.GetDailyCenterSummaryAsync_TotalServed_MatchesManualCount | Passed | 00:00:00.0006384 |
| 120 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportRepositoryIntegrationTests | QueueLanka.API.Tests.ReportRepositoryIntegrationTests.GetDailyCenterSummaryAsync_TotalSkipped_MatchesManualCount | Passed | 00:00:00.0006362 |
| 121 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportsAuthorizationTests | QueueLanka.API.Tests.ReportsAuthorizationTests.AdminJwt_InvalidCenterFilter_Returns400WithSafeMessage | Passed | 00:00:00.0805326 |
| 122 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportsAuthorizationTests | QueueLanka.API.Tests.ReportsAuthorizationTests.AdminJwt_ValidCenterSummary_ReturnsCsvAttachment | Passed | 00:00:00.0475968 |
| 123 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportsAuthorizationTests | QueueLanka.API.Tests.ReportsAuthorizationTests.NoJwt_CenterSummaryReport_Returns401 | Passed | 00:00:00.6607233 |
| 124 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportsAuthorizationTests | QueueLanka.API.Tests.ReportsAuthorizationTests.OfficerJwt_CenterSummaryReport_Returns403 | Passed | 00:00:00.0055716 |
| 125 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportServiceTests | QueueLanka.API.Tests.ReportServiceTests.GenerateDailyCenterSummaryCsvAsync_AverageTimesFormattedInMinutesWithOneDecimal | Passed | 00:00:00.0195662 |
| 126 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportServiceTests | QueueLanka.API.Tests.ReportServiceTests.GenerateDailyCenterSummaryCsvAsync_CsvEscapesCommasAndQuotesInCenterName | Passed | 00:00:00.0057676 |
| 127 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportServiceTests | QueueLanka.API.Tests.ReportServiceTests.GenerateDailyCenterSummaryCsvAsync_EmptyResult_ReturnsHeadersOnlyWithoutException | Passed | 00:00:00.0070526 |
| 128 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportServiceTests | QueueLanka.API.Tests.ReportServiceTests.GenerateDailyCenterSummaryCsvAsync_SummaryRowTotalsAreCorrect | Passed | 00:00:00.0032805 |
| 129 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportServiceTests | QueueLanka.API.Tests.ReportServiceTests.GenerateDailyCenterSummaryCsvAsync_ValidRequest_ReturnsCsvWithCorrectHeaders | Passed | 00:00:00.0042052 |
| 130 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportServiceTests | QueueLanka.API.Tests.ReportServiceTests.GenerateDailyCenterSummaryCsvAsync_ValidRequestWithData_ReturnsRowsWithExpectedValues | Passed | 00:00:00.0048318 |
| 131 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportServiceTests | QueueLanka.API.Tests.ReportServiceTests.GetDailyCenterSummaryDataAsync_CenterFilterApplied_OnlySpecifiedCentersReturned | Passed | 00:00:00.1106326 |
| 132 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportServiceTests | QueueLanka.API.Tests.ReportServiceTests.GetDailyCenterSummaryDataAsync_DateRangeExceeds90Days_ThrowsValidationException | Passed | 00:00:00.0044970 |
| 133 | Backend | .NET xUnit | QueueLanka.API.Tests.ReportServiceTests | QueueLanka.API.Tests.ReportServiceTests.GetDailyCenterSummaryDataAsync_ToDateBeforeFromDate_ThrowsValidationException | Passed | 00:00:00.0038728 |
| 134 | Backend | .NET xUnit | QueueLanka.API.Tests.ServiceCenterControllerTests | QueueLanka.API.Tests.ServiceCenterControllerTests.CheckAvailability_Available_ReturnsOkWithTrue | Passed | 00:00:00.0014706 |
| 135 | Backend | .NET xUnit | QueueLanka.API.Tests.ServiceCenterControllerTests | QueueLanka.API.Tests.ServiceCenterControllerTests.CheckAvailability_InvalidId_ThrowsInvalidServiceCenterDataException | Passed | 00:00:00.0040823 |
| 136 | Backend | .NET xUnit | QueueLanka.API.Tests.ServiceCenterControllerTests | QueueLanka.API.Tests.ServiceCenterControllerTests.CheckAvailability_NotActive_ReturnsOkWithFalse | Passed | 00:00:00.0013159 |
| 137 | Backend | .NET xUnit | QueueLanka.API.Tests.ServiceCenterControllerTests | QueueLanka.API.Tests.ServiceCenterControllerTests.CheckAvailability_NotAvailable_ReturnsOkWithFalse | Passed | 00:00:00.0012015 |
| 138 | Backend | .NET xUnit | QueueLanka.API.Tests.ServiceCenterControllerTests | QueueLanka.API.Tests.ServiceCenterControllerTests.CheckAvailability_NotFound_ThrowsServiceCenterNotFoundException | Passed | 00:00:00.0101767 |
| 139 | Backend | .NET xUnit | QueueLanka.API.Tests.ServiceCenterControllerTests | QueueLanka.API.Tests.ServiceCenterControllerTests.CreateServiceCenter_DuplicateCenter_ThrowsDuplicateServiceCenterException | Passed | 00:00:00.0063694 |
| 140 | Backend | .NET xUnit | QueueLanka.API.Tests.ServiceCenterControllerTests | QueueLanka.API.Tests.ServiceCenterControllerTests.CreateServiceCenter_ServiceThrows_Throws | Passed | 00:00:00.0059127 |
| 141 | Backend | .NET xUnit | QueueLanka.API.Tests.ServiceCenterControllerTests | QueueLanka.API.Tests.ServiceCenterControllerTests.CreateServiceCenter_ValidRequest_Returns201Created | Passed | 00:00:00.0055886 |
| 142 | Backend | .NET xUnit | QueueLanka.API.Tests.ServiceCenterControllerTests | QueueLanka.API.Tests.ServiceCenterControllerTests.GetAllServiceCenters_EmptyList_ReturnsOkWithEmptyList | Passed | 00:00:00.0017395 |
| 143 | Backend | .NET xUnit | QueueLanka.API.Tests.ServiceCenterControllerTests | QueueLanka.API.Tests.ServiceCenterControllerTests.GetAllServiceCenters_ServiceThrows_Throws | Passed | 00:00:00.0026762 |
| 144 | Backend | .NET xUnit | QueueLanka.API.Tests.ServiceCenterControllerTests | QueueLanka.API.Tests.ServiceCenterControllerTests.GetAllServiceCenters_ValidRequest_ReturnsOkWithList | Passed | 00:00:00.0036216 |
| 145 | Backend | .NET xUnit | QueueLanka.API.Tests.ServiceCenterControllerTests | QueueLanka.API.Tests.ServiceCenterControllerTests.GetLocation_CenterNotFound_ThrowsServiceCenterNotFoundException | Passed | 00:00:00.0022949 |
| 146 | Backend | .NET xUnit | QueueLanka.API.Tests.ServiceCenterControllerTests | QueueLanka.API.Tests.ServiceCenterControllerTests.GetLocation_InvalidId_ThrowsInvalidServiceCenterDataException | Passed | 00:00:00.0032096 |
| 147 | Backend | .NET xUnit | QueueLanka.API.Tests.ServiceCenterControllerTests | QueueLanka.API.Tests.ServiceCenterControllerTests.GetLocation_LocationNotFound_ThrowsLocationNotFoundException | Passed | 00:00:00.0023063 |
| 148 | Backend | .NET xUnit | QueueLanka.API.Tests.ServiceCenterControllerTests | QueueLanka.API.Tests.ServiceCenterControllerTests.GetLocation_ValidId_ReturnsOk | Passed | 00:00:00.0012797 |
| 149 | Backend | .NET xUnit | QueueLanka.API.Tests.ServiceCenterControllerTests | QueueLanka.API.Tests.ServiceCenterControllerTests.GetServiceCenterById_InvalidId_ThrowsInvalidServiceCenterDataException | Passed | 00:00:00.1282079 |
| 150 | Backend | .NET xUnit | QueueLanka.API.Tests.ServiceCenterControllerTests | QueueLanka.API.Tests.ServiceCenterControllerTests.GetServiceCenterById_NegativeId_ThrowsInvalidServiceCenterDataException | Passed | 00:00:00.0161723 |
| 151 | Backend | .NET xUnit | QueueLanka.API.Tests.ServiceCenterControllerTests | QueueLanka.API.Tests.ServiceCenterControllerTests.GetServiceCenterById_NotFound_ThrowsServiceCenterNotFoundException | Passed | 00:00:00.0028308 |
| 152 | Backend | .NET xUnit | QueueLanka.API.Tests.ServiceCenterControllerTests | QueueLanka.API.Tests.ServiceCenterControllerTests.GetServiceCenterById_ValidId_ReturnsOk | Passed | 00:00:00.0013532 |
| 153 | Backend | .NET xUnit | QueueLanka.API.Tests.ServiceCenterControllerTests | QueueLanka.API.Tests.ServiceCenterControllerTests.UpsertLocation_CenterNotFound_ThrowsServiceCenterNotFoundException | Passed | 00:00:00.0037286 |
| 154 | Backend | .NET xUnit | QueueLanka.API.Tests.ServiceCenterControllerTests | QueueLanka.API.Tests.ServiceCenterControllerTests.UpsertLocation_InvalidId_ThrowsInvalidServiceCenterDataException | Passed | 00:00:00.0037129 |
| 155 | Backend | .NET xUnit | QueueLanka.API.Tests.ServiceCenterControllerTests | QueueLanka.API.Tests.ServiceCenterControllerTests.UpsertLocation_ServiceThrows_Throws | Passed | 00:00:00.0044875 |
| 156 | Backend | .NET xUnit | QueueLanka.API.Tests.ServiceCenterControllerTests | QueueLanka.API.Tests.ServiceCenterControllerTests.UpsertLocation_ValidRequest_ReturnsOk | Passed | 00:00:00.0048538 |
| 157 | Backend | .NET xUnit | QueueLanka.API.Tests.TokenControllerTests | QueueLanka.API.Tests.TokenControllerTests.CancelMyToken_AdminUser_PassesIsAdminTrue | Passed | 00:00:00.0018656 |
| 158 | Backend | .NET xUnit | QueueLanka.API.Tests.TokenControllerTests | QueueLanka.API.Tests.TokenControllerTests.CancelMyToken_AlreadyCancelled_ReturnsConflict | Passed | 00:00:00.0017982 |
| 159 | Backend | .NET xUnit | QueueLanka.API.Tests.TokenControllerTests | QueueLanka.API.Tests.TokenControllerTests.CancelMyToken_NotCancellable_ReturnsUnprocessableEntity | Passed | 00:00:00.0042135 |
| 160 | Backend | .NET xUnit | QueueLanka.API.Tests.TokenControllerTests | QueueLanka.API.Tests.TokenControllerTests.CancelMyToken_Success_ReturnsOk | Passed | 00:00:00.0011097 |
| 161 | Backend | .NET xUnit | QueueLanka.API.Tests.TokenControllerTests | QueueLanka.API.Tests.TokenControllerTests.CancelMyToken_TokenNotFound_ReturnsNotFound | Passed | 00:00:00.0011666 |
| 162 | Backend | .NET xUnit | QueueLanka.API.Tests.TokenControllerTests | QueueLanka.API.Tests.TokenControllerTests.CancelMyToken_UnauthenticatedUser_ReturnsUnauthorized | Passed | 00:00:00.0007202 |
| 163 | Backend | .NET xUnit | QueueLanka.API.Tests.TokenControllerTests | QueueLanka.API.Tests.TokenControllerTests.GetMyTokens_AuthenticatedUser_ReturnsOkWithTokens | Passed | 00:00:00.0012087 |
| 164 | Backend | .NET xUnit | QueueLanka.API.Tests.TokenControllerTests | QueueLanka.API.Tests.TokenControllerTests.GetMyTokens_NoTokens_ReturnsOkWithEmptyList | Passed | 00:00:00.0021762 |
| 165 | Backend | .NET xUnit | QueueLanka.API.Tests.TokenControllerTests | QueueLanka.API.Tests.TokenControllerTests.GetMyTokens_UnauthenticatedUser_ReturnsUnauthorized | Passed | 00:00:00.1063967 |
| 166 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/api/appointmentApi.test.ts | appointmentApi bookToken unwraps api envelope data | Passed | 3.11 ms |
| 167 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/api/appointmentApi.test.ts | appointmentApi getMyAppointments unwraps list data | Passed | 0.72 ms |
| 168 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/api/authApi.test.ts | authApi loginUser returns response payload | Passed | 0.45 ms |
| 169 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/api/authApi.test.ts | authApi maps axios error message from backend | Passed | 1.05 ms |
| 170 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/api/authApi.test.ts | authApi maps unknown errors to network fallback message | Passed | 0.38 ms |
| 171 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/api/authApi.test.ts | authApi registerUser returns response payload | Passed | 5.2 ms |
| 172 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/api/reportsApi.test.ts | reportsApi downloads CSV using filename from content-disposition | Passed | 6.69 ms |
| 173 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/api/reportsApi.test.ts | reportsApi handles large CSV payloads without truncating generated blob URL flow | Passed | 1.02 ms |
| 174 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/api/reportsApi.test.ts | reportsApi maps blob errors to generic report failure message | Passed | 0.47 ms |
| 175 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/api/reportsApi.test.ts | reportsApi surfaces backend message from JSON error payload | Passed | 0.32 ms |
| 176 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/api/reportsApi.test.ts | reportsApi throws explicit no-data error for 204 response | Passed | 1.06 ms |
| 177 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/api/tokenApi.test.ts | tokenApi cancelToken maps auth errors | Passed | 1.1 ms |
| 178 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/api/tokenApi.test.ts | tokenApi cancelToken maps network and unknown errors | Passed | 0.38 ms |
| 179 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/api/tokenApi.test.ts | tokenApi cancelToken maps not found and already-cancelled errors | Passed | 0.59 ms |
| 180 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/api/tokenApi.test.ts | tokenApi getMyTokens unwraps envelope | Passed | 2.29 ms |
| 181 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/api/tokenApi.test.ts | tokenApi getServiceCenterQueue unwraps envelope | Passed | 0.37 ms |
| 182 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/api/userApi.test.ts | userApi deleteAdminUser calls endpoint and maps network timeout | Passed | 0.73 ms |
| 183 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/api/userApi.test.ts | userApi maps backend code to friendly message | Passed | 1.45 ms |
| 184 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/api/userApi.test.ts | userApi returns admin users and forwards params | Passed | 2.94 ms |
| 185 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/components/serviceCenter/ServiceCenterCard.test.tsx | ServiceCenterCard exports CSV with selected date range for admin users | Passed | 31.36 ms |
| 186 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/components/serviceCenter/ServiceCenterCard.test.tsx | ServiceCenterCard shows export error message when download fails | Passed | 23.43 ms |
| 187 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/components/serviceCenter/ServiceCenterCard.test.tsx | ServiceCenterCard shows loading state while export is in progress | Passed | 55.55 ms |
| 188 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/components/serviceCenter/ServiceCenterCard.test.tsx | ServiceCenterCard shows queue booking action for non-admin users | Passed | 147.54 ms |
| 189 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/pages/AdminDashboardPage.test.tsx | AdminDashboardPage falls back to zeroed stats if data fetch fails | Passed | 21.92 ms |
| 190 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/pages/AdminDashboardPage.test.tsx | AdminDashboardPage re-fetches dashboard data when refresh is clicked | Passed | 130.81 ms |
| 191 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/pages/AdminDashboardPage.test.tsx | AdminDashboardPage renders dashboard metrics derived from fetched API data | Passed | 107.48 ms |
| 192 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/pages/DashboardPage.test.tsx | DashboardPage calls refresh when user clicks the refresh button | Passed | 21.59 ms |
| 193 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/pages/DashboardPage.test.tsx | DashboardPage renders token cards when active tokens exist | Passed | 8.16 ms |
| 194 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/pages/DashboardPage.test.tsx | DashboardPage shows API error when token fetch fails | Passed | 5.22 ms |
| 195 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/pages/DashboardPage.test.tsx | DashboardPage shows empty-state prompt when user has no active tokens | Passed | 163.9 ms |
| 196 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/pages/DashboardPage.test.tsx | DashboardPage shows loading state while tokens are being fetched | Passed | 35.33 ms |
| 197 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/utils/validation.test.ts | validation utils computes password strength labels | Passed | 0.89 ms |
| 198 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/utils/validation.test.ts | validation utils validates email values | Passed | 1.65 ms |
| 199 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/utils/validation.test.ts | validation utils validates login password rules | Passed | 0.29 ms |
| 200 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/utils/validation.test.ts | validation utils validates strict password rules | Passed | 0.52 ms |
| 201 | Frontend | Vitest | C:/Users/user/Desktop/Qlanka-pro/frontend/src/utils/validation.test.ts | validation utils validates usernames | Passed | 0.2 ms |

## US-R-02 Acceptance Validation

Story: Advanced Dynamic Reports (Ad-hoc + PDF/CSV)

| Acceptance Criterion | Status | Evidence |
|---|---|---|
| Admin can choose filters and metrics and preview results. | Partial | Current UI allows admin date-range selection and center-scoped export from ServiceCenterCard. No ad-hoc metric picker or preview grid for custom report composition is present. |
| Export to CSV and PDF works and matches the preview. | Partial | CSV export is implemented and tested. PDF export is not implemented in UI/API. There is no preview artifact to compare against exports. |
| GET /reports/custom?... returns correct aggregates. | Not implemented | No `/reports/custom` endpoint exists in the current backend controller set. Existing endpoints are `/api/reports/daily-summary/csv` and `/api/reports/centers/{id}/summary`. |
| Large exports are streamed or paginated without timeouts. | Partial | Frontend CSV handling includes large payload test; backend includes p95 latency assertions for report endpoint. Streaming/pagination contract for ad-hoc custom reports is not implemented. |

### Evidence References

- Backend CSV report endpoints in `backend/QueueLanka.Queue/Controllers/ReportsController.cs`.
- Frontend CSV API in `frontend/src/api/reportsApi.ts`.
- Admin export UI and filters in `frontend/src/components/serviceCenter/ServiceCenterCard.tsx`.
- CSV authorization and contract tests in `backend/QueueLanka.API.Tests/ReportsAuthorizationTests.cs`.
- CSV consistency and latency tests in `backend/QueueLanka.API.Tests/QueueApiConsistencyAndPerformanceTests.cs`.
- Frontend CSV behavior tests in `frontend/src/api/reportsApi.test.ts` and `frontend/src/components/serviceCenter/ServiceCenterCard.test.tsx`.

### US-R-02 Conclusion

US-R-02 is not fully complete against the stated acceptance criteria.

- Implemented: admin CSV export path with date filters, auth checks, aggregate consistency checks, and basic large-payload/latency validation.
- Missing for completion: ad-hoc report builder with metric selection and preview, PDF export, and `/reports/custom` aggregate endpoint with streaming or pagination semantics.
