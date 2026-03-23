# User Guide: Daily Center Summary Report Export

This guide explains how administrators can export the **Daily Center Summary Report** to analyze service performance and queue trends across different centers.

## Overview

The Daily Center Summary Report provides a high-level view of token activity, service efficiency, and peak usage periods for one or more service centers. The report is exported in **CSV (Comma-Separated Values)** format, which can be opened in Excel, Google Sheets, or other data analysis tools.

## Exporting the Report

### Selection Parameters

To generate a report, the following criteria must be defined:

1.  **Date Range**: Select a "From Date" and "To Date".
    -   *Rule*: The maximum range allowed is **90 days**.
    -   *Rule*: The "To Date" must be the same as or after the "From Date".
2.  **Center Selection (Optional)**: You can filter the report to include specific centers. If no centers are selected, the report will include data for all centers you have permission to view.

## Understanding the Report Columns

The exported CSV file contains the following columns for each day and center:

| Column | Description |
| :--- | :--- |
| **Date** | The specific date of the activity (YYYY-MM-DD). |
| **Center Name** | The display name of the service center. |
| **Tokens Issued** | Total number of tokens taken by citizens that day. |
| **Served** | Number of tokens successfully completed by an officer. |
| **Skipped** | Number of tokens where the citizen did not show up. |
| **Cancelled** | Number of tokens cancelled by the citizen via the app or kiosk. |
| **No Shows** | Number of tokens that expired or were marked as no-shows. |
| **Avg Wait Time (min)** | Average minutes citizens waited before being called. |
| **Avg Service Time (min)** | Average minutes spent at the counter per citizen. |
| **Peak Hour** | The hour (00:00 - 23:00) with the highest token volume. |
| **Peak Hour Tokens** | The number of tokens issued during that peak hour. |
| **Active Counters** | The number of unique counters that served at least one token. |

## Sample Output

Below is an example of how the data will appear in your spreadsheet:

```csv
Date,Center ID,Center Name,Tokens Issued,Served,Skipped,Cancelled,No Shows,Avg Wait Time (min),Avg Service Time (min),Peak Hour,Peak Hour Tokens,Active Counters
2026-03-21,1,"Colombo Main",450,380,40,20,10,14.5,12.2,10:00,85,12
2026-03-22,1,"Colombo Main",410,360,30,15,5,11.2,10.5,11:00,72,10
Total,,,860,740,70,35,15,,,157,22
```

## Best Practices

-   **Monthly Analysis**: Export reports at the end of each month to identify long-term trends in service center traffic.
-   **Peak Hour Planning**: Use the "Peak Hour" data to adjust officer shifts and ensure maximum counter availability during busy periods.
-   **Efficiency Monitoring**: Compare "Avg Service Time" across centers to identify where additional training or process improvements might be needed.
