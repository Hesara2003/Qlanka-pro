# Reports and Analytics - UAT Test Scenarios

## Project Context
**Project Name:** QueueLanka Pro
**System Type:** Microservices-based Queue Management System

---

## 1. 🎯 Business Objective
The primary business objective of the Reports and Analytics module is to transform raw queue data into actionable insights. By monitoring Key Performance Indicators (KPIs) and generating customizable reports, management can identify operational bottlenecks, measure staff efficiency, forecast busy periods, and ultimately make data-driven decisions that improve customer satisfaction across all service centers.

## 2. 📊 Reports & Analytics Overview
* **Analytics Dashboard:** A visual interface displaying high-level KPIs (Total Served, Average Wait Time) and graphical charts (bar, line, pie) to provide an immediate overview of system performance.
* **Reporting Features:** An ad-hoc report builder that allows authorized users to apply specific filters (date ranges, service centers, token status), select desired metrics, and export the resulting data for offline analysis or compliance auditing.

## 3. 🧪 UAT Test Scenarios

### Scenario 1: Generating a Report and Verifying Data Accuracy
* **Preconditions:** The system has exactly 50 "Served" tickets and 10 "Skipped" tickets recorded for the "Colombo Center" on October 1st.
* **Step-by-step actions:**
  1. Navigate to the "Reports" module.
  2. Set Date Filter to "Oct 1 - Oct 1".
  3. Set Center Filter to "Colombo Center".
  4. Select metrics: "Total Served" and "Total Skipped".
  5. Click "Generate Report".
* **Expected results:** The generated UI table strictly displays 50 Served and 10 Skipped. No data from other days or centers is included.

### Scenario 2: Viewing and Interpreting the Analytics Dashboard
* **Preconditions:** The Admin logs into the system during active operational hours.
* **Step-by-step actions:**
  1. Navigate to "Analytics Dashboard".
  2. Observe the KPI cards (e.g., Average Wait Time).
  3. Apply a global filter changing the view from "All Centers" to "Kandy Branch".
* **Expected results:** All KPI cards and charts instantly refresh. The numbers displayed dynamically recalculate to reflect only the Kandy branch data without requiring a full page reload.

### Scenario 3: Exporting Reports (CSV/PDF)
* **Preconditions:** A custom report has been successfully generated on the screen.
* **Step-by-step actions:**
  1. Click the "Export" button on the top right of the report grid.
  2. Select "Download as PDF".
  3. Repeat the process and select "Download as CSV".
* **Expected results:** Two files are downloaded. The PDF retains the visual layout suitable for printing. The CSV opens cleanly in Excel, with columns acting as headers and no merged-cell formatting errors.

### Scenario 4: Handling Empty or No-Data Scenarios
* **Preconditions:** The system has no recorded data for future dates (e.g., next month).
* **Step-by-step actions:**
  1. Navigate to the "Reports" module.
  2. Set the Date Filter to a date range in the future.
  3. Click "Generate Report".
* **Expected results:** The system does not crash or show a "Zero Division Error". Instead, it displays a friendly placeholder message such as: "No data available for the selected criteria."

### Scenario 5: Handling Incorrect Filters (Negative Scenario)
* **Preconditions:** The user is on the Reports configuration page.
* **Step-by-step actions:**
  1. Select a "From Date" of October 15.
  2. Attempt to select a "To Date" of October 10.
  3. Click "Generate Report".
* **Expected results:** The system blocks the action. The UI highlights the date picker in red and shows a validation error: "End Date cannot be earlier than Start Date."

## 4. 📋 UAT Test Case Table

| Test Case ID | Scenario Name | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **UAT-REP-01** | Report Data Accuracy | 1. Apply specific filters<br>2. Generate<br>3. Verify against known data | Results perfectly match the expected subset of data. | [ ] |
| **UAT-REP-02** | Dashboard KPI Filtering | 1. View Dashboard<br>2. Change Center filter | All charts and number cards update dynamically. | [ ] |
| **UAT-REP-03** | CSV/PDF Export | 1. Generate report<br>2. Export as CSV & PDF | Files download successfully, data format is clean and matches UI. | [ ] |
| **UAT-REP-04** | Empty Dataset Handling | 1. Select future date<br>2. Generate report | System shows "No Data Available" safely. | [ ] |
| **UAT-REP-05** | Date Sequence Validation | 1. Set End Date < Start Date<br>2. Attempt generation | Form validation prevents generation with a clear error. | [ ] |
| **UAT-REP-06** | Unauthorized Access | 1. Login as Officer<br>2. Force URL to /reports | User is blocked and redirected (403 Forbidden). | [ ] |

## 5. 📊 Data Validation Approach
To confidently verify that the front-end dashboard and reports are accurate, the QA team must utilize a **"Known State" testing approach**:
1. **Test Data Injection:** Insert a pre-calculated, known set of mock data straight into the database through automated test scripts (e.g., 100 tickets with specific wait times).
2. **UI vs DB Comparison:** Generate the report on the UI. Simultaneously, the QA writes a direct SQL/NoSQL query against the database mimicking the same filters. 
3. **Reconciliation:** The aggregate outputs (e.g., Total Count, Average Time) from the direct Database query must mathematically match the numbers rendered on the Frontend UI.

## 6. 📊 Validation Checklist
- [ ] Exported CSVs contain exactly the same rows/columns as the UI data table.
- [ ] Averages (like Wait Time) are mathematically correct and rounded to two decimal places.
- [ ] Graphical charts (Pie/Line) correctly map the axis labels and legends to their data sources.
- [ ] Report generation on a 30-day data range completes within acceptable performance limits (e.g., < 5 seconds).
- [ ] Unauthorized roles (Officers, normal Customers) cannot view or generate systemic reports.

## 7. ⚠️ Edge Cases & Negative Scenarios
* **Large Data Set Delays:** Querying data spanning over a whole year. The UI should display a loading spinner instead of freezing, giving the user feedback that the query is processing.
* **Calculations with Zeros:** If a center opens but receives 0 customers, the "Average Wait Time" calculation must not trigger a "Divide by Zero" API error. It should elegantly output "0 mins" or "N/A".
* **Missing Filter Combinations:** Allowing a user to click "Generate" without selecting any metrics. The system should disable the button until at least one metric is checked.

## 8. 🧾 BA Summary
The UAT for the Reports and Analytics module guarantees the integrity, accuracy, and usability of the system’s data presentation layer. Because administrators rely heavily on these metrics for strategic planning, ensuring exact mathematical correctness and stable performance under varying filter combinations is critical. The successful validation of these scenarios ensures that QueueLanka Pro serves not just as an operational tool, but as a trustworthy business intelligence platform.

---

## 🎓 Academic / Viva Preparation section

### 🌟 3 Critical Scenarios to Highlight in Your Viva
1. **Report Data Accuracy (UAT-REP-01):** Proves you understand how to reconcile frontend visualizations with backend database states (The "Known State" approach).
2. **Invalid Date Sequence Validation (UAT-REP-05):** Highlights your attention to input validation and preventing malformed queries from hitting the database engine.
3. **Calculations with Zeros / Empty Sets (UAT-REP-04):** Demonstrates awareness of mathematical edge cases (like Divide by Zero) that frequently crash analytics modules.

### ❓ Possible Viva Questions & Answers

**Q1: How do you practically prove that the "Average Wait Time" KPI on the dashboard is correct during UAT?**
*Answer:* As a QA/BA, I would not test this on a live, churning database. I would set up a controlled test environment, insert exactly 3 specific tokens (e.g., Waiting times of 5 mins, 10 mins, and 15 mins). I know the mathematical average is 10 minutes. I then look at the dashboard; if it says 10 minutes, the logic is sound. This is known as "Known State" validation.

**Q2: If an Admin attempts to pull a report for the entire past year, the system might lag. How did you document the handling of this edge case?**
*Answer:* Large dataset extraction is a major edge case. In our UAT scenarios, we stipulate two things: Firstly, the UI must show a loading indicator so the user doesn't think the system froze. Secondly, if the data is massive, the microservice architecture should ideally implement pagination or timeout rules, prompting the user to narrow their date range if the query exceeds a specific threshold (e.g., 10 seconds).

**Q3: When testing exports (CSV/PDF), what specific formatting issues are you looking to avoid?**
*Answer:* For PDFs, we look for visual alignment—ensuring columns don't run off the right side of the page. For CSVs, it's about data structure. We ensure that raw data fields don't accidentally contain commas that would break the CSV column layout, and that date/time strings export in a universally recognized format (like ISO 8601) so Excel doesn't misinterpret them.