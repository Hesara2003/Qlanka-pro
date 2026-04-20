# Advanced Reporting (Ad-hoc Report Builder) - Business Analysis Document

## Project Context
**Project Name:** QueueLanka Pro
**System Type:** Microservices-based Queue Management System

---

## 1. 🎯 Business Objective
The primary objective of the Advanced Reporting (Ad-hoc Report Builder) feature is to empower administrators with a dynamic, self-service data insights tool. Instead of relying on static, pre-defined reports, administrators can dynamically select metrics and apply custom filters to generate specific insights. This flexibility allows center managers and system admins to analyze queue performance, staffing efficiency, and customer wait times on demand, ultimately leading to better resource allocation and improved customer satisfaction.

## 2. 📋 Functional Requirements
* **FR-AR-001 (Feature Access):** The system shall restrict access to the Advanced Reporting module to users with the `Admin` role only.
* **FR-AR-002 (Metric Selection):** The system shall allow users to select one or multiple data metrics for their report, including but not limited to: Average Wait Time, Total Queued Customers, Served Customers, Dropped/No-show Customers, and Service Time.
* **FR-AR-003 (Dynamic Filtering):** The system shall provide filtering capabilities allowing users to constrain data by: Date range (Start Date and End Date), Service Center location, and Token Status (e.g., Pending, Served, Skipped).
* **FR-AR-004 (Report Generation):** The system shall dynamically process the selected metrics and filters to generate a summarized data table and corresponding visual charts on the dashboard.
* **FR-AR-005 (Export Functionality):** The system shall allow users to export the generated ad-hoc reports in both CSV (Comma Separated Values) and PDF formats.

## 3. ⚙️ Non-Functional Requirements
* **NFR-AR-001 (Performance):** The system must generate and render ad-hoc reports involving up to 30 days of data within 3 seconds under normal load.
* **NFR-AR-002 (Security):** All exported report files must be stripped of any Personally Identifiable Information (PII) beyond what is strictly necessary for operational analytics, ensuring GDPR/Data Privacy compliance.
* **NFR-AR-003 (Usability):** The interface should be intuitive enough that an Administrator requires less than 15 minutes of training to successfully generate and export a custom report.
* **NFR-AR-004 (Availability):** The reporting database services must maintain an uptime of 99.9%, as data accessibility is critical for administrative operations.

## 4. 📘 User Guide

### Accessing the Report Builder
1. Log into the **QueueLanka Pro** portal using your Admin credentials.
2. From the main navigation menu on the left, click on **Analytics & Reports**.
3. Select **Ad-hoc Report Builder** from the dropdown menu.

### Step-by-Step: Creating a Report
1. **Select Metrics:** In the "Metrics" section, check the boxes next to the data points you want to analyze (e.g., *Average Wait Time*, *Total Served*).
2. **Apply Filters:**
   * **Date Range:** Use the calendar picker to select a "From" and "To" date.
   * **Service Center:** Choose a specific branch from the dropdown list, or leave as "All Centers" for a system-wide view.
   * **Status:** Select the specific token statuses you are interested in (e.g., only *Served* tokens).
3. **Generate Report:** Click the blue **Generate Report** button. The data table and charts will populate below within a few seconds.

### Exporting Reports
1. Ensure your desired report is visible on the screen.
2. In the top right corner of the report viewer, click the **Export** button.
3. Choose either **Download as PDF** (best for printing/sharing) or **Download as CSV** (best for spreadsheet analysis).
4. The file will automatically save to your computer's `Downloads` folder.

## 5. 🧪 UAT Test Scenarios

| Scenario ID | Test Scenario | Given | When | Then |
| :--- | :--- | :--- | :--- | :--- |
| **UAT-AR-01** | Verify Admin Access | A user is logged in as a standard Officer | They attempt to access the Ad-hoc Report Builder URL | The system displays an "Unauthorized Access" error and redirects to the dashboard. |
| **UAT-AR-02** | Generate report with multiple filters | An Admin is on the Report Builder page | They select "Wait Time", set a 7-day date range, choose "Colombo Center", and click Generate | The report displays data strictly matching the requested 7-day period for the Colombo Center. |
| **UAT-AR-03** | Verify PDF Export | A report has been successfully generated on the screen | The Admin clicks "Export" and selects "PDF" | A correctly formatted PDF file downloads containing the exact data shown on the screen. |
| **UAT-AR-04** | Verify empty state handling | An Admin is on the Report Builder page | They select filters for a future date where no data exists and click Generate | The system displays a friendly "No data found for the selected criteria" message instead of crashing. |

## 6. 📊 Validation Checklist
- [ ] Only Admin users can view the Advanced Reporting menu item.
- [ ] Date picker restricts users from selecting end dates earlier than start dates.
- [ ] At least one metric must be selected before the "Generate" button becomes active.
- [ ] The PDF export matches the styling and data of the on-screen report.
- [ ] Large data queries (e.g., 3 months of data) resolve without timing out.
- [ ] The CSV export opens correctly in MS Excel without formatting errors.

## 7. ⚠️ Troubleshooting Guide

* **Issue: "No Data Available" message appears after generating.**
  * *Solution:* Check your date range and ensure the selected Service Center was operational during that time. Try expanding the date range.
* **Issue: The report takes too long to load and times out.**
  * *Solution:* You may be querying too much data at once. Try narrowing the date range to 1 or 2 weeks instead of several months.
* **Issue: PDF Export layout looks misaligned.**
  * *Solution:* If too many metrics are selected, the PDF may struggle to fit everything on one page. Reduce the number of selected metrics or use the CSV export for wide datasets.
* **Issue: Cannot select "Generate" (Button is grayed out).**
  * *Solution:* Ensure you have completed all required fields. You must select at least one Date Range and at least one Metric.

## 8. 🧾 BA Summary
The Advanced Reporting module has been successfully implemented to provide dynamic, self-serve analytical capabilities to System Administrators. By moving away from rigid, legacy reporting structures, QueueLanka Pro now allows management to slice and dice queuing data based on immediate operational needs. This feature directly supports data-driven decision-making, ensuring that service centers can actively monitor wait times, balance workloads, and optimize customer throughput efficiently.

---

## 🎓 Academic / Viva Preparation section

**Q1: Why did we choose to implement an Ad-hoc Report Builder instead of just providing 5 or 6 standard, fixed reports?**
*Answer:* Fixed reports often fail to address the day-to-day, specific questions management might have (e.g., "How did branch X perform on Friday afternoon specifically?"). An ad-hoc builder provides flexibility, allowing users to define their own parameters. This reduces future development overhead since we don't have to code a new report every time the business has a new question, making the software more scalable and valuable.

**Q2: How does the system ensure performance (NFR-AR-001) when an Admin requests a complex report over a large dataset?**
*Answer:* In a microservices architecture, fetching huge aggregations in real-time can freeze the database. We handle this through techniques like database indexing on frequently filtered columns (like Date and Center ID), and potentially using a Read-Replica database for heavy reporting so that the primary transactional database (handling live queue tickets) is not slowed down.

**Q3: How do you handle Data Privacy in these reports, especially during the CSV export?**
*Answer:* As a Business Analyst, I defined strict data minimization rules for this feature. The reporting module is designed to aggregate data (e.g., counting total tokens, averaging wait times) rather than displaying individual customer records. Even if detail-level data is exported, PII such as customer names or phone numbers are masked or omitted, ensuring GDPR/local privacy compliance while still delivering business value.