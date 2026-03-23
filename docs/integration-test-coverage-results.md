# Integration Test Coverage and Results

This document summarizes the testing infrastructure, coverage, and recent results for the Qlanka-pro system. It serves as a reference for quality assurance and future audits.

## Testing Framework

The system utilizes a robust testing stack for both unit and integration tests:
-   **Execution Framework**: xUnit 2.4.2
-   **Mocking**: Moq 4.20.70 (used extensively for service-level and controller-level tests)
-   **Assertions**: FluentAssertions 6.12.2
-   **Database Integration**: MySqlConnector (used for repository-level integration tests)

---

## Test Project Structure

-   **Project**: `QueueLanka.API.Tests`
-   **Location**: `backend/QueueLanka.API.Tests/`
-   **Target**: .NET 8.0

---

## Test Coverage Summary

### 1. Unit Tests (Controller & Service Level)
The suite includes **66 unit tests** focused on individual component logic, ensuring accurate HTTP responses and error handling across all major controllers.

| Component                  | Focus Area                          | Tests | Status |
| -------------------------- | ----------------------------------- | ----- | ------ |
| `AdminUserController`      | User retrieval, deletion, filtering | 11    | Passed |
| `AppointmentController`    | Booking tokens, my appointments     | 10    | Passed |
| `AuthController`           | Registration, login, email verify   | 11    | Passed |
| `ServiceCenterController`  | Center listing, CRUD, availability  | 18    | Passed |
| `TokenController`          | Token status, cancellation          | 9     | Passed |
| `CounterService`           | Business logic for reassign/status  | 7     | Passed |

### 2. Integration Tests (Repository Level)
Repository tests validate the data access layer against a real MySQL instance, ensuring complex SQL queries and aggregations are correct.

#### Scenarios Covered:
-   **Daily Center Summary Aggregation**:
    -   Calculation of `TotalTokensIssued`, `TotalServed`, and `TotalSkipped`.
    -   Average wait time calculation based on issued vs. called timestamps.
    -   **Peak Hour Logic**: Identification of the hour with the highest token issuance.
-   **Filtering & Validation**:
    -   Filtering results by specific `CenterId` and `DateRange`.
    -   Graceful handling of empty result sets (returning empty lists vs. null).
-   **CSV Export Validation**:
    -   Ensuring generated CSV structures match expected schemas.
    -   Validation of 90-day export limits for report data.

---

## Interpreting Test Results

### Running Tests Locally
To execute the full test suite, navigate to the test project directory and run:
```powershell
dotnet test --verbosity normal
```

### Understanding the Output
-   **Passed (Green)**: The scenario behaved exactly as expected.
-   **Failed (Red)**: The code produced an unexpected result or threw an unhandled exception. The console will display:
    -   `Expected: [value]`, `Actual: [value]`
    -   Stack trace pointing to the failing assertion.
-   **Skipped (Yellow)**: The test was bypassed (usually due to missing environment variables like `TEST_DB_CONNECTION_STRING`).

---

## Conclusion

The current test suite provides high confidence in the core business logic, particularly for **Token Lifecycle**, **User Authentication**, and **Reporting Data Accuracy**. 

**Status: ALL AUTOMATED TESTS PASSING (100% SUCCESS RATE)**
