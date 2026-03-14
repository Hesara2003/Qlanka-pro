

**Total Tests: 66** | **Passed: 66** | **Failed: 0**

---

## 1. AdminUserControllerTests (12 tests)

| # | Test Name | Scenario | Expected |
|---|-----------|----------|----------|
| 1 | `GetUsers_NoFilters_ReturnsOkWithUserList` | No filters provided | 200 OK with user list |
| 2 | `GetUsers_WithRoleFilter_ReturnsOkWithFilteredList` | Valid role filter | 200 OK filtered |
| 3 | `GetUsers_WithIsActiveFilter_ReturnsOkWithFilteredList` | Active status filter | 200 OK filtered |
| 4 | `GetUsers_InvalidRoleFilter_ThrowsInvalidUserRoleFilterException` | Invalid role value | Throws (400) |
| 5 | `GetUsers_EmptyResult_ReturnsOkWithEmptyList` | No users found | 200 OK empty |
| 6 | `GetUsers_ServiceThrowsException_Throws` | Database error | Throws (500) |
| 7 | `DeleteUser_ValidId_ReturnsOk` | Valid user ID | 200 OK |
| 8 | `DeleteUser_ZeroId_ThrowsInvalidUserIdException` | ID = 0 | Throws (400) |
| 9 | `DeleteUser_NegativeId_ThrowsInvalidUserIdException` | ID = -1 | Throws (400) |
| 10 | `DeleteUser_UserNotFound_ThrowsUserNotFoundException` | Non-existent user | Throws (404) |
| 11 | `DeleteUser_TargetIsAdmin_ThrowsCannotDeleteAdminException` | Target is admin | Throws (403) |
| 12 | `DeleteUser_ServiceThrowsDataAccessException_Throws` | Database error | Throws (500) |

---

## 2. AppointmentControllerTests (10 tests)

| # | Test Name | Scenario | Expected |
|---|-----------|----------|----------|
| 13 | `BookToken_ValidRequest_ReturnsOk` | Valid booking request | 200 OK |
| 14 | `BookToken_UnauthenticatedUser_ReturnsUnauthorized` | Missing user claim | 401 Unauthorized |
| 15 | `BookToken_ArgumentException_ReturnsNotFound` | Center not found | 404 NotFound |
| 16 | `BookToken_InvalidOperationException_ReturnsConflict` | Booking conflict | 409 Conflict |
| 17 | `BookToken_DuplicateBookingException_Throws` | Duplicate booking | Throws (409) |
| 18 | `BookToken_CenterFullException_Throws` | Center at capacity | Throws (409) |
| 19 | `BookToken_UnexpectedException_ReturnsStatusCode500` | Unexpected error | 500 Internal Error |
| 20 | `GetMyAppointments_AuthenticatedUser_ReturnsOkWithList` | Valid request | 200 OK with list |
| 21 | `GetMyAppointments_UnauthenticatedUser_ReturnsUnauthorized` | Missing user claim | 401 Unauthorized |
| 22 | `GetMyAppointments_NoAppointments_ReturnsOkWithEmptyList` | No bookings | 200 OK empty |

---

## 3. AuthControllerTests (12 tests)

| # | Test Name | Scenario | Expected |
|---|-----------|----------|----------|
| 23 | `Register_ValidRequest_Returns201Created` | Valid registration | 201 Created |
| 24 | `Register_DuplicateUsername_ThrowsDuplicateUsernameException` | Username taken | Throws (409) |
| 25 | `Register_DuplicateEmail_ThrowsDuplicateEmailException` | Email taken | Throws (409) |
| 26 | `Register_InvalidModelState_ReturnsUnprocessableEntity` | Validation error | 422 Unprocessable |
| 27 | `Login_ValidCredentials_ReturnsOk` | Valid login | 200 OK with JWT |
| 28 | `Login_InvalidCredentials_ThrowsInvalidCredentialsException` | Wrong password | Throws (401) |
| 29 | `Login_AccountDisabled_ThrowsAccountDisabledException` | Deactivated account | Throws (403) |
| 30 | `Login_InvalidModelState_ReturnsBadRequest` | Validation error | 400 BadRequest |
| 31 | `VerifyEmail_ValidToken_ReturnsOk` | Valid token | 200 OK |
| 32 | `VerifyEmail_EmptyToken_ReturnsBadRequest` | Empty string | 400 BadRequest |
| 33 | `VerifyEmail_WhitespaceToken_ReturnsBadRequest` | Whitespace only | 400 BadRequest |
| 34 | `VerifyEmail_InvalidToken_ThrowsInvalidVerificationTokenException` | Expired/invalid token | Throws (400) |

---

## 4. ServiceCenterControllerTests (23 tests)

| # | Test Name | Scenario | Expected |
|---|-----------|----------|----------|
| 35 | `GetAllServiceCenters_ValidRequest_ReturnsOkWithList` | Normal request | 200 OK with list |
| 36 | `GetAllServiceCenters_EmptyList_ReturnsOkWithEmptyList` | No centers | 200 OK empty |
| 37 | `GetAllServiceCenters_ServiceThrows_Throws` | Database error | Throws (500) |
| 38 | `GetServiceCenterById_ValidId_ReturnsOk` | Valid ID | 200 OK |
| 39 | `GetServiceCenterById_InvalidId_ThrowsInvalidServiceCenterDataException` | ID = 0 | Throws (400) |
| 40 | `GetServiceCenterById_NegativeId_ThrowsInvalidServiceCenterDataException` | ID = -5 | Throws (400) |
| 41 | `GetServiceCenterById_NotFound_ThrowsServiceCenterNotFoundException` | Non-existent | Throws (404) |
| 42 | `CheckAvailability_Available_ReturnsOkWithTrue` | Available center | 200 OK, true |
| 43 | `CheckAvailability_NotAvailable_ReturnsOkWithFalse` | Unavailable | 200 OK, false |
| 44 | `CheckAvailability_NotActive_ReturnsOkWithFalse` | Inactive center | 200 OK, false |
| 45 | `CheckAvailability_InvalidId_ThrowsInvalidServiceCenterDataException` | ID = 0 | Throws (400) |
| 46 | `CheckAvailability_NotFound_ThrowsServiceCenterNotFoundException` | Non-existent | Throws (404) |
| 47 | `CreateServiceCenter_ValidRequest_Returns201Created` | Valid request | 201 Created |
| 48 | `CreateServiceCenter_DuplicateCenter_ThrowsDuplicateServiceCenterException` | Duplicate name+address | Throws (409) |
| 49 | `CreateServiceCenter_ServiceThrows_Throws` | Database error | Throws (500) |
| 50 | `GetLocation_ValidId_ReturnsOk` | Valid ID | 200 OK |
| 51 | `GetLocation_InvalidId_ThrowsInvalidServiceCenterDataException` | ID = 0 | Throws (400) |
| 52 | `GetLocation_CenterNotFound_ThrowsServiceCenterNotFoundException` | Non-existent center | Throws (404) |
| 53 | `GetLocation_LocationNotFound_ThrowsLocationNotFoundException` | No location row | Throws (404) |
| 54 | `UpsertLocation_ValidRequest_ReturnsOk` | Valid upsert | 200 OK |
| 55 | `UpsertLocation_InvalidId_ThrowsInvalidServiceCenterDataException` | ID = 0 | Throws (400) |
| 56 | `UpsertLocation_CenterNotFound_ThrowsServiceCenterNotFoundException` | Non-existent center | Throws (404) |
| 57 | `UpsertLocation_ServiceThrows_Throws` | Database error | Throws (500) |

---

## 5. TokenControllerTests (9 tests)

| # | Test Name | Scenario | Expected |
|---|-----------|----------|----------|
| 58 | `GetMyTokens_AuthenticatedUser_ReturnsOkWithTokens` | Valid request | 200 OK with tokens |
| 59 | `GetMyTokens_UnauthenticatedUser_ReturnsUnauthorized` | Missing user claim | 401 Unauthorized |
| 60 | `GetMyTokens_NoTokens_ReturnsOkWithEmptyList` | No tokens | 200 OK empty |
| 61 | `CancelMyToken_Success_ReturnsOk` | Valid cancel | 200 OK |
| 62 | `CancelMyToken_UnauthenticatedUser_ReturnsUnauthorized` | Missing user claim | 401 Unauthorized |
| 63 | `CancelMyToken_AlreadyCancelled_ReturnsConflict` | Already cancelled | 409 Conflict |
| 64 | `CancelMyToken_NotCancellable_ReturnsUnprocessableEntity` | Being served/completed | 422 Unprocessable |
| 65 | `CancelMyToken_TokenNotFound_ReturnsNotFound` | Token not found | 404 NotFound |
| 66 | `CancelMyToken_AdminUser_PassesIsAdminTrue` | Admin cancels token | 200 OK, isAdmin=true |

---

## Summary

| Controller | Test File | Tests |
|-----------|-----------|-------|
| `AdminUserController` | `AdminUserControllerTests.cs` | 12 |
| `AppointmentController` | `AppointmentControllerTests.cs` | 10 |
| `AuthController` | `AuthControllerTests.cs` | 12 |
| `ServiceCenterController` | `ServiceCenterControllerTests.cs` | 23 |
| `TokenController` | `TokenControllerTests.cs` | 9 |
| **Total** | | **66** |
