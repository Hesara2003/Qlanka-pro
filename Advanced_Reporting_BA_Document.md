# QueueLanka Pro: Advanced Reporting Feature Documentation

## 1. 🎯 Business Objective
The primary objective of the Advanced Reporting (Ad-hoc Report Builder) feature is to empower administrators with dynamic, real-time insights into system operations. By allowing Admin users to flexibly filter data and select specific performance metrics (e.g., wait times, queue lengths), the system moves beyond rigid, pre-defined reports. This facilitates data-driven decision-making, helps identify operational bottlenecks across different service centers, and ultimately improves resource allocation and customer satisfaction.

## 2. 📋 Functional Requirements
*   **FR-AR-001 (Role-Based Access):** The system shall restrict access to the Ad-hoc Report Builder interface exclusively to users assigned the "Admin" role.
*   **FR-AR-002 (Dynamic Filtering):** The system shall allow users to apply multiple data filters simultaneously, including Date Range (Start/End Date), Service Center Location, and Ticket Status (e.g., Waiting, Served, Abandoned).
*   **FR-AR-003 (Metric Selection):** The system shall allow users to select one or more specific metrics to be displayed, such as Average Wait Time, Maximum Queue Length, Total Tickets Issued, and Counter Utilization.
*   **FR-AR-004 (Report Preview):** The system shall generate and display a tabular preview of the requested report within the user interface based on the selected filters and metrics.
*   **FR-AR-005 (Export Functionality):** The system shall provide the capability to export the generated report data in both Comma Separated Values (.csv) and Portable Document Format (.pdf) formats.
*   **FR-AR-006 (Empty State Handling):** The system shall display a clear, user-friendly message when a generated report yields zero results for the selected criteria.

## 3. ⚙️ Non-Functional Requirements
*   **NFR-AR-001 (Performance):** The system shall generate and render the report preview within 3 seconds for datasets containing up to 50,000 records.
*   **NFR-AR-002 (Usability):** The interface shall be intuitive enough that an Admin user can generate their first report without prior training in under 5 clicks.
*   **NFR-AR-003 (Security):** All generated reports and exports shall be logged in the system's audit trail, recording the Admin's User ID, timestamp, and the specific filters applied.
*   **NFR-AR-004 (Availability):** The reporting module shall leverage the underlying Azure and YARP Gateway infrastructure to maintain a 99.9% uptime, ensuring reports can be generated during peak business hours.

## 4. 📘 User Guide

This guide provides step-by-step instructions for Admin users to generate and export custom reports.

### Accessing the Report Builder
1. Log in to the QueueLanka Pro portal using your Admin credentials.
2. Navigate to the left-hand menu and click on **Analytics & Reports**.
3. Select **Ad-hoc Report Builder** from the sub-menu.

### Step 1: Applying Filters
1. Locate the **Data Filters** panel on the left side of the screen.
2. **Date Range:** Click the calendar icon to select a *Start Date* and an *End Date*.
3. **Service Center:** Click the dropdown and select a specific branch (e.g., "Colombo Main"). To view data for all branches, leave this blank or select "All".
4. **Status:** Check the boxes next to the ticket statuses you want to analyze (e.g., check `Served` and `Abandoned`).

### Step 2: Selecting Metrics
1. Move to the **Metrics Configuration** section below the filters.
2. Check the boxes for the exact data points you wish to see. Options include:
    *   *Wait Time Analysis* (Average, Max)
    *   *Queue Length* (Total Volume, Peak Length)
    *   *Usage Metrics* (Total Served, Counter Idle Time)

### Step 3: Generating the Report
1. Once your filters and metrics are selected, click the primary blue **Generate Report** button.
2. A data table previewing your customized report will appear in the main viewing area.

### Step 4: Exporting Reports
1. Look to the top-right corner of the generated report preview table.
2. Click the **Export** button to reveal a dropdown menu.
3. Select **Export as CSV** (best for opening in Excel to do further data manipulation) OR select **Export as PDF** (best for printing, sharing, or presenting).
4. The file will automatically download to your computer's designated "Downloads" folder.

## 5. 🧪 UAT Test Scenarios

| Scenario ID | Test Scenario | Steps to Execute | Expected Result |
| :--- | :--- | :--- | :--- |
| **UAT-AR-01** | Verify Admin Access | Log in as standard Counter Staff. Look for "Ad-hoc Report Builder" in the menu. | The menu option is hidden and completely inaccessible to non-Admin users. |
| **UAT-AR-02** | Generate Report with Multiple Filters | Log in as Admin. Select 'Last 7 Days', 'Kandy Branch', and metric 'Average Wait Time'. Click Generate. | A data table loads displaying the correct average wait times specifically for the Kandy branch over the last 7 days. |
| **UAT-AR-03** | Verify PDF Export | Generate a valid report. Click Export -> Export as PDF. Open the downloaded file. | The PDF downloads successfully, opens without errors, and the data matches the on-screen preview. |
| **UAT-AR-04** | Handle Empty Data Sets | Select a future date range (e.g., next month). Click Generate. | The system does not crash; instead, it displays a polite message: *"No data found for the selected criteria."* |

## 6. 📊 Validation Checklist
- [x] "Ad-hoc Report Builder" menu item is restricted to the Admin role only.
- [x] Date picker prevents selecting an End Date that occurs before the Start Date.
- [x] The "Service Center" dropdown correctly lists all active centers from the database.
- [x] Selected metrics accurately map to the columns displayed in the generated preview.
- [x] The CSV export correctly formats columns and rows without data misalignment.
- [x] The PDF export is legible and fits securely within standard page margins.
- [x] The backend API securely handles the query payload via the WSO2 API Manager.

## 7. ⚠️ Troubleshooting Guide

| Common Issue | Potential Cause | Solution |
| :--- | :--- | :--- |
| **Export button is greyed out/disabled** | A report preview has not been generated yet. | You must click "Generate Report" and wait for the data table to load before you can export. |
| **Report is taking too long to load (spinning wheel)** | The selected date range is too wide (e.g., 5 years of data), causing a database query timeout. | Refresh the page and try selecting a narrower date range (e.g., 1 to 3 months) to speed up the query. |
| **CSV opens in Excel but all data is squeezed into one column** | Excel is not recognizing the comma delimiter based on regional computer settings. | In Excel, go to the 'Data' tab, select 'Text to Columns', choose 'Delimited', and ensure 'Comma' is checked. |
| **"No data found" for a day we were definitely open** | The selected Service Center filter might be incorrect, or the specific status filters selected yield zero results. | Double-check that your filters (especially Service Center and Status) are correctly applied and try again. |

## 8. 🧾 BA Summary
The Advanced Reporting module successfully delivers a highly requested administrative capability for QueueLanka Pro. By leveraging our existing React frontend and .NET Web API microservices architecture, we have provided Admin users with a flexible, self-serve tool to extract meaningful operational metrics. The inclusion of CSV and PDF export options ensures that data can be easily shared or further analyzed by management. This feature meets all defined functional and non-functional requirements, passing performance and security validations, and is ready to deliver immediate business value by optimizing queue management strategies.

***

### 🎓 Academic Supplement: Expected Viva Questions & Answers

**Q1: How did you ensure data security and integrity in this reporting feature?**
**Answer:** I addressed security primarily through Role-Based Access Control (RBAC) defined in functional requirement FR-AR-001, ensuring only Admins can access the builder. Additionally, non-functional requirement NFR-AR-003 mandates audit logging for every generated report. Since we are using an API Manager (WSO2), we ensure that the backend .NET microservices only accept reporting queries that carry a valid Admin security token.

**Q2: What is the difference between your Functional and Non-Functional Requirements for this feature?**
**Answer:** Functional requirements define *what* the system must do to solve the business problem. For example, FR-AR-005 states the system *must* export files in CSV and PDF. Non-functional requirements define *how well* the system performs those functions. For instance, NFR-AR-001 dictates that the report *must* load within 3 seconds. Functional is about behavior; non-functional is about quality attributes like speed, usability, and security.

**Q3: If a user reports that the system "crashes" when they try to pull a report for the whole year, how would you, as a BA, address this?**
**Answer:** First, I would refer to the Troubleshooting Guide to confirm if it's a query timeout issue due to massive data volume. Then, I would review our performance NFRs to see if the system was only designed to handle smaller sets (e.g., 50,000 records within 3 seconds). If this is a new business need, I would write a new requirement to either paginate the data, run massive reports as a background job (asynchronous processing), or restrict the date picker to a maximum of 3 months per query to protect the Azure database performance.
