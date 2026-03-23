# Technical Guide: Daily Center Summary Report Export

This document provides a technical overview of the implementation, data extraction, and CSV generation logic for the Daily Center Summary Report.

## API Specification

### Export Daily Center Summary CSV

**Endpoint**: `GET /api/reports/daily-summary/csv`
**Authorization**: Bearer Token with `admin` role
**Accept**: `text/csv`

#### Query Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `fromDate` | DateTime | Yes | Start date of the reporting period. |
| `toDate` | DateTime | Yes | End date of the reporting period (inclusive). |
| `centerIds` | string | No | Comma-separated list of integers to filter by service center. |
| `format` | string | No | Defaults to `csv`. |

#### Response (200 OK)
Returns a downloadable file with the content-type `text/csv`.

---

## Backend Implementation

### Controller Layer (`ReportsController.cs`)
The controller handles parameter parsing and basic validation:
1.  **Parsing**: `centerIds` string is split and converted into a `List<int>`.
2.  **DTO Mapping**: Maps query parameters to `DailyCenterSummaryRequestDto`.
3.  **No Content**: If the repository returns zero rows, the controller returns `204 No Content` to prevent empty file downloads.

### Service Layer (`ReportService.cs`)
The service layer implements the reporting business rules and CSV formatting:
1.  **Validation**:
    -   `toDate` must be ≥ `fromDate`.
    -   Date range is capped at **90 days** to prevent timeout issues on large datasets.
2.  **CSV Formatting**:
    -   Uses `StringBuilder` for high-performance string concatenation.
    -   Fields containing special characters are escaped using standard CSV escaping rules (e.g., `"Value" -> """Value"""`).
    -   **UTF-8 BOM**: The file starts with a Byte Order Mark (`0xEF, 0xBB, 0xBF`) to ensure correct character rendering in Excel.

### Repository Layer (`ReportRepository.cs`)
The repository executes a specialized aggregation query (typically against the `Tokens` and `Counters` tables) to fetch:
-   Daily counts for Issued, Served, Skipped, and Cancelled statuses.
-   Aggregated wait and service times (calculated in seconds).
-   Peak hour identification using a `GROUP BY DATEPART(hour, ...)` subquery.

---

## Error Handling

-   **`VALIDATION_ERROR` (400)**: Returned if the date range is invalid or exceeds the 90-day limit.
-   **`INVALID_CENTER_FILTER` (400)**: Returned if `centerIds` contains non-integer values.
-   **`FORBIDDEN` (403)**: Returned if a non-admin user attempts to access the reporting endpoint.

## CSV Structure Details

-   **Header Row**: `Date,Center ID,Center Name,Tokens Issued,Served,Skipped,Cancelled,No Shows,Avg Wait Time (min),Avg Service Time (min),Peak Hour,Peak Hour Tokens,Active Counters`
-   **Footer Row**: Includes a `Total` row that sums the numerical columns for the entire date range.
-   **Decimal Formatting**: Minutes are formatted to one decimal place (e.g., `12.5`).
-   **Peak Hour Formatting**: Displayed in 24-hour format (e.g., `10:00`).
