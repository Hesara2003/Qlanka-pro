# QA Test Report — QueueLanka Pro
## Token Booking Flow & Conflict Scenarios


### Project Information

| Field             | Details                                      |
|-------------------|----------------------------------------------|
| **Project**       | QueueLanka Pro — ASP.NET Core Web API        |
| **Module**        | Token Booking Flow                           |
| **Test Project**  | `QueueLanka.API.Tests`                       |
| **Test File**     | `TokenBookingControllerTests.cs`             |
| **Target Class**  | `AppointmentController`                      |
| **Mocked Service**| `IAppointmentService`                        |
| **Framework**     | .NET 8                                       |
| **Test Type**     | Unit Tests (No integration, No DB)           |


### Tools & Packages Used

| Package                | Version    | Purpose                                  |
|------------------------|------------|------------------------------------------|
| `xUnit`                | 2.5.3      | Test framework — defines and runs tests  |
| `Moq`                  | 4.20.72    | Mocks `IAppointmentService`              |
| `FluentAssertions`     | 8.8.0      | Readable, expressive assertions          |
| `Microsoft.NET.Test.Sdk` | 17.8.0   | Required test host for .NET              |
| `coverlet.collector`   | 6.0.0      | Optional code coverage collection        |



### Test Setup

Each test uses a shared constructor that prepares:

- A **mocked** `IAppointmentService` using Moq - no real database calls are made.
- A **fake authenticated user** (`UserId = 1`) injected via `ClaimsPrincipal` to simulate JWT auth.
- A **fresh `AppointmentController`** instance for every test - clean and isolated.






### Test Results Summary

| # |                   Test Method                                      | Category         | Expected Outcome              | Status |
|---|--------------------------------------------------------------------|------------------|-------------------------------|--------|
| 1 | `BookToken_ShouldReturn200OK_WhenBookingIsSuccessful`              | BookToken        | 200 OK                        | PASS   |
| 2 | `BookToken_ShouldReturn409Conflict_WhenBookingConflictDetected`    | BookToken        | 409 Conflict                  | PASS   |
| 3 | `GetMyAppointments_ShouldReturn200OK_WhenUserHasBookings`          | Get Bookings     | 200 OK + 2 items              | PASS   |
| 4 | `GetMyAppointments_ShouldReturn200OK_WithEmptyList_WhenNoBookings` | Get Bookings     | 200 OK + empty list           | PASS   |
| 5 | `BookToken_ShouldGenerateUniqueToken_ForEachBooking`               | Token Generation | Two distinct token numbers    | PASS   |
| 6 | `BookToken_ShouldReturnConflict_WhenTwoUsersBookSameSlot`          | Conflict Handling| 409 Conflict                  | PASS   |
| 7 | `BookToken_ShouldReturnConfirmationResponse_AfterSuccessfulBooking`| Confirmation     | 200 OK + TokenNumber + Status | PASS   |
| 8 | `BookToken_ShouldReturn404NotFound_WhenServiceCenterNotFound`      | Error Handling   | 404 Not Found                 | PASS   |
| 9 | `BookToken_ShouldReturn401Unauthorized_WhenUserClaimIsMissing`     | Auth Guard       | 401 Unauthorized              | PASS   |

**Total: 9 | Passed: 9 | Failed: 0 | Skipped: 0**



### Detailed Test Cases





##### Test 1  Successful Booking Returns 200 OK

| Field       | Details                                           |
|-------------|---------------------------------------------------|
| **Method**  | `BookToken(BookAppointmentRequestDto)`            |
| **Setup**   | Mock returns a valid `AppointmentResponseDto`     |
| **Input**   | `CenterId=1`, tomorrow's date, `10:00` time slot  |
| **Expected**| `200 OK` with response body                       |
| **Result**  | PASS                                              |



##### Test 2 - Booking Conflict Returns 409 Conflict

| Field       | Details                                                                         |
|-------------|---------------------------------------------------------------------------------|
| **Method**  | `BookToken(BookAppointmentRequestDto)`                                          |
| **Setup**   | Mock throws `InvalidOperationException("This time slot is already booked...")`  |
| **Input**   | Same slot already taken                                                         |
| **Expected**| `409 Conflict`                                                                  |                                                                
| **Result**  | PASS                                                                            |




#### b GetBookingById  Viewing Bookings



##### Test 3 Returns 200 OK With Booking List

| Field       | Details                                                 |
|-------------|---------------------------------------------------------|
| **Method**  | `GetMyAppointments()`                                   |
| **Setup**   | Mock returns a list of 2 `AppointmentResponseDto` items |
| **Expected**| `200 OK` + list count = 2                               |
| **Result**  | PASS                                                    |



##### Test 4 — Returns 200 OK With Empty List When No Bookings Exist

| Field       | Details                         |
|-------------|---------------------------------|
| **Method**  | `GetMyAppointments()`           |
| **Setup**   | Mock returns an empty list      |
| **Expected**| `200 OK` + empty list           |
| **Result**  | PASS                            |




#### c Token Generation - Uniqueness Check



##### Test 5  Each Booking Gets a Unique Token Number

| Field       | Details                                                                         |
|-------------|---------------------------------------------------------------------------------|
| **Method**  | `BookToken()` called twice                                                      |
| **Setup**   | `SetupSequence` returns two responses with different `TokenNumber` values       |
| **Expected**| `dto1.TokenNumber != dto2.TokenNumber`                                          |
| **Result**  | PASS                                                                            |



**Token Format used in production service:**

TKN-{CenterId}-{yyMMdd}-{RandomHex4}
Example: TKN-1-250615-A3F2


#### d Conflict Handling - Same Slot, Multiple Users

---

##### Test 6 - Returns 409 When Two Users Book the Same Slot

| Field       | Details                                                                         |
|-------------|---------------------------------------------------------------------------------|
| **Method**  | `BookToken()`                                                                   |
| **Setup**   | Mock throws `InvalidOperationException` for any userId on the same request      |
| **Expected**| `409 Conflict`                                                                  |
| **Result**  | PASS                                                                            |  



#### e Confirmation Delivery - Response Completeness



##### Test 7  Confirmation Response Contains Required Fields

| Field       | Details                                                                 |
|-------------|-------------------------------------------------------------------------|
| **Method**  | `BookToken()`                                                           |
| **Setup**   | Mock returns a full `AppointmentResponseDto`                            |
| **Expected**| `AppointmentId > 0`, `TokenNumber` is not empty, `Status == "Scheduled"`|
| **Result**  | PASS                                                                    |




##### Test 8  Returns 404 When Service Center Does Not Exist

| Field       | Details                                                         |
|-------------|-----------------------------------------------------------------|
| **Method**  | `BookToken()`                                                   |
| **Setup**   | Mock throws `ArgumentException("Service center not found...")`  |
| **Expected**| `404 Not Found`                                                 |
| **Result**  | PASS                                                            |



##### Test 9  Returns 401 When User Claim Is Missing

| Field       | Details                                                         |
|-------------|-----------------------------------------------------------------|
| **Method**  | `BookToken()`                                                   |
| **Setup**   | Controller given a `ClaimsPrincipal` with no identity claims    |
| **Expected**| `401 Unauthorized`                                              |
| **Result**  | PASS                                                            |








