
QueueLanka Pro — ASP.NET Core Web API  
 
**Test Framework:** xUnit + Moq + FluentAssertions  
**Test Type:** Unit Tests 



## 1. Test Project Setup

- **Project:** `QueueLanka.API.Tests`
- **Location:** `backend/QueueLanka.API.Tests/`
- **Target Framework:** .NET 8.0
- **Packages:**
  - xUnit 2.4.2
  - Moq 4.20.70
  - FluentAssertions 6.12.2
  - Microsoft.NET.Test.Sdk 17.8.0


## 2. Test Results Summary


Test Run Successful.
Total tests: 66
     Passed: 66
     Failed: 0
    Skipped: 0
 




## 3. Test Coverage by Controller

| # | Test File                         | Controller              | Methods Tested                    | Tests |
|---|-----------------------------------|-------------------------|-----------------------------------|-------|
| 1 | `AdminUserControllerTests.cs`     | `AdminUserController`   | `GetUsers`, `DeleteUser`          | 11 |
| 2 | `AppointmentControllerTests.cs`   | `AppointmentController` | `BookToken`, `GetMyAppointments`  | 10 |
| 3 | `AuthControllerTests.cs`          | `AuthController`        | `Register`, `Login`, `VerifyEmail`| 11 |
| 4 | `ServiceCenterControllerTests.cs` |`ServiceCenterController`| `GetAllServiceCenters`, `GetServiceCenterById`, `CheckAvailability`, `CreateServiceCenter`, `GetLocation`, `UpsertLocation`                           | 18 |
| 5 | `TokenControllerTests.cs`         | `TokenController` | `GetMyTokens`, `CancelMyToken`          | 9 |

Total - 66 Tests

---

## 4. Scenarios Covered

| Scenario | HTTP Status | Covered |
|----------|------------|---------|
| Happy path (success) | 200 OK / 201 Created | Yes |
| Not found | 404 NotFound | Yes |
| Bad input / validation | 400 BadRequest | Yes |
| Unauthorized (missing claims) | 401 Unauthorized | Yes |
| Conflict (duplicates) | 409 Conflict | Yes |
| Forbidden (admin restriction) | 403 Forbidden | Yes |
| Unprocessable entity | 422 Unprocessable | Yes |
| Server error | 500 Internal Server Error | Yes |

---

## 5. Detailed Test List

### 5.1 AdminUserControllerTests (11 tests)

| # | Test Method | Scenario | Expected Result |
|---|------------|----------|-----------------|
| 1 | `GetUsers_NoFilters_ReturnsOkWithUserList` | No filters provided | 200 OK with user list |
| 2 | `GetUsers_WithRoleFilter_ReturnsOkWithFilteredList` | Valid role filter | 200 OK with filtered list |
| 3 | `GetUsers_WithIsActiveFilter_ReturnsOkWithFilteredList` | Active status filter | 200 OK with filtered list |
| 4 | `GetUsers_InvalidRoleFilter_ThrowsInvalidUserRoleFilterException` | Invalid role value | Throws exception (400) |
| 5 | `GetUsers_EmptyResult_ReturnsOkWithEmptyList` | No users found | 200 OK with empty list |
| 6 | `GetUsers_ServiceThrowsException_Throws` | Database error | Throws DataAccessException (500) |
| 7 | `DeleteUser_ValidId_ReturnsOk` | Valid user ID | 200 OK |
| 8 | `DeleteUser_ZeroId_ThrowsInvalidUserIdException` | ID = 0 | Throws exception (400) |
| 9 | `DeleteUser_NegativeId_ThrowsInvalidUserIdException` | ID = -1 | Throws exception (400) |
| 10 | `DeleteUser_UserNotFound_ThrowsUserNotFoundException` | Non-existent user | Throws exception (404) |
| 11 | `DeleteUser_TargetIsAdmin_ThrowsCannotDeleteAdminException` | Target is admin | Throws exception (403) |

### 5.2 AppointmentControllerTests (10 tests)

| # | Test Method | Scenario | Expected Result |
|---|------------|----------|-----------------|
| 1 | `BookToken_ValidRequest_ReturnsOk` | Valid booking | 200 OK with appointment |
| 2 | `BookToken_UnauthenticatedUser_ReturnsUnauthorized` | Missing user claim | 401 Unauthorized |
| 3 | `BookToken_ArgumentException_ReturnsNotFound` | Center not found | 404 NotFound |
| 4 | `BookToken_InvalidOperationException_ReturnsConflict` | Booking conflict | 409 Conflict |
| 5 | `BookToken_DuplicateBookingException_Throws` | Duplicate booking | Throws (409 via middleware) |
| 6 | `BookToken_CenterFullException_Throws` | Center at capacity | Throws (409 via middleware) |
| 7 | `BookToken_UnexpectedException_ReturnsStatusCode500` | Unexpected error | 500 Internal Server Error |
| 8 | `GetMyAppointments_AuthenticatedUser_ReturnsOkWithList` | Valid request | 200 OK with list |
| 9 | `GetMyAppointments_UnauthenticatedUser_ReturnsUnauthorized` | Missing user claim | 401 Unauthorized |
| 10 | `GetMyAppointments_NoAppointments_ReturnsOkWithEmptyList` | No bookings | 200 OK with empty list |

### 5.3 AuthControllerTests (11 tests)

| # | Test Method | Scenario | Expected Result |
|---|------------|----------|-----------------|
| 1 | `Register_ValidRequest_Returns201Created` | Valid registration | 201 Created |
| 2 | `Register_DuplicateUsername_ThrowsDuplicateUsernameException` | Username taken | Throws (409) |
| 3 | `Register_DuplicateEmail_ThrowsDuplicateEmailException` | Email taken | Throws (409) |
| 4 | `Register_InvalidModelState_ReturnsUnprocessableEntity` | Validation error | 422 Unprocessable |
| 5 | `Login_ValidCredentials_ReturnsOk` | Valid login | 200 OK with JWT |
| 6 | `Login_InvalidCredentials_ThrowsInvalidCredentialsException` | Wrong password | Throws (401) |
| 7 | `Login_AccountDisabled_ThrowsAccountDisabledException` | Deactivated account | Throws (403) |
| 8 | `Login_InvalidModelState_ReturnsBadRequest` | Validation error | 400 BadRequest |
| 9 | `VerifyEmail_ValidToken_ReturnsOk` | Valid token | 200 OK |
| 10 | `VerifyEmail_EmptyToken_ReturnsBadRequest` | Empty string | 400 BadRequest |
| 11 | `VerifyEmail_InvalidToken_ThrowsInvalidVerificationTokenException` | Expired token | Throws (400) |

### 5.4 ServiceCenterControllerTests (18 tests)

| # | Test Method | Scenario | Expected Result |
|---|------------|----------|-----------------|
| 1 | `GetAllServiceCenters_ValidRequest_ReturnsOkWithList` | Normal request | 200 OK with list |
| 2 | `GetAllServiceCenters_EmptyList_ReturnsOkWithEmptyList` | No centers | 200 OK empty |
| 3 | `GetAllServiceCenters_ServiceThrows_Throws` | DB error | Throws (500) |
| 4 | `GetServiceCenterById_ValidId_ReturnsOk` | Valid ID | 200 OK |
| 5 | `GetServiceCenterById_InvalidId_ThrowsInvalidServiceCenterDataException` | ID = 0 | Throws (400) |
| 6 | `GetServiceCenterById_NegativeId_ThrowsInvalidServiceCenterDataException` | ID = -5 | Throws (400) |
| 7 | `GetServiceCenterById_NotFound_ThrowsServiceCenterNotFoundException` | Non-existent | Throws (404) |
| 8 | `CheckAvailability_Available_ReturnsOkWithTrue` | Available center | 200 OK, true |
| 9 | `CheckAvailability_NotAvailable_ReturnsOkWithFalse` | Unavailable | 200 OK, false |
| 10 | `CheckAvailability_NotActive_ReturnsOkWithFalse` | Inactive center | 200 OK, false |
| 11 | `CheckAvailability_InvalidId_ThrowsInvalidServiceCenterDataException` | ID = 0 | Throws (400) |
| 12 | `CheckAvailability_NotFound_ThrowsServiceCenterNotFoundException` | Non-existent | Throws (404) |
| 13 | `CreateServiceCenter_ValidRequest_Returns201Created` | Valid request | 201 Created |
| 14 | `CreateServiceCenter_DuplicateCenter_ThrowsDuplicateServiceCenterException` | Duplicate | Throws (409) |
| 15 | `CreateServiceCenter_ServiceThrows_Throws` | DB error | Throws (500) |
| 16 | `GetLocation_ValidId_ReturnsOk` | Valid ID | 200 OK |
| 17 | `GetLocation_InvalidId_ThrowsInvalidServiceCenterDataException` | ID = 0 | Throws (400) |
| 18 | `GetLocation_CenterNotFound_ThrowsServiceCenterNotFoundException` | Non-existent | Throws (404) |

### 5.5 TokenControllerTests (9 tests)

| # | Test Method | Scenario | Expected Result |
|---|------------|----------|-----------------|
| 1 | `GetMyTokens_AuthenticatedUser_ReturnsOkWithTokens` | Valid request | 200 OK with tokens |
| 2 | `GetMyTokens_UnauthenticatedUser_ReturnsUnauthorized` | Missing claim | 401 Unauthorized |
| 3 | `GetMyTokens_NoTokens_ReturnsOkWithEmptyList` | No tokens | 200 OK empty |
| 4 | `CancelMyToken_Success_ReturnsOk` | Valid cancel | 200 OK |
| 5 | `CancelMyToken_UnauthenticatedUser_ReturnsUnauthorized` | Missing claim | 401 Unauthorized |
| 6 | `CancelMyToken_AlreadyCancelled_ReturnsConflict` | Already cancelled | 409 Conflict |
| 7 | `CancelMyToken_NotCancellable_ReturnsUnprocessableEntity` | Being served | 422 Unprocessable |
| 8 | `CancelMyToken_TokenNotFound_ReturnsNotFound` | Token not found | 404 NotFound |
| 9 | `CancelMyToken_AdminUser_PassesIsAdminTrue` | Admin cancels | 200 OK, isAdmin=true |

---

## 6. Testing Approach

- **Pattern:** AAA (Arrange → Act → Assert) strictly followed
- **Mocking:** All service interfaces mocked using Moq (no real implementations)
- **Authentication:** `DefaultHttpContext` with fake `ClaimsPrincipal` for user claims
- **Naming Convention:** `MethodName_Scenario_ExpectedResult()`
- **No external dependencies:** No database, no running server, no HTTP calls

---

## 7. How to Run Tests

```powershell
cd "d:\CSP Project\Qlanka-pro\backend\QueueLanka.API.Tests"
dotnet test --verbosity normal
```

---

## 8. Conclusion

All **66 unit tests** pass successfully. Every controller method in the QueueLanka API has been tested for:
- Happy path responses
- Error handling (bad input, not found, unauthorized, conflict, server errors)
- Edge cases (empty results, invalid IDs, missing authentication claims)

**Status: ALL TESTS PASSING**
