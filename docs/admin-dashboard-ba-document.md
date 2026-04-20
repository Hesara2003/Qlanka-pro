# Admin Dashboard - Business Analysis Document

## Project Context
**Project Name:** QueueLanka Pro
**System Type:** Microservices-based Queue Management System

---

## 1. 🎯 Business Objective
The Admin Dashboard serves as the central command center for system administrators and high-level managers. Its primary objective is to provide a comprehensive, real-time, and historical "bird's-eye view" of queue operations across all service centers. By transforming raw queue data into visual insights, the dashboard empowers decision-makers to easily identify bottlenecks, monitor staff efficiency, and execute proactive operational improvements to improve customer flows.

## 2. 📋 Functional Requirements
* **FR-DB-001 (Access Control):** The system shall grant access to the Admin Dashboard exclusively to users authenticated with the `Admin` role.
* **FR-DB-002 (KPI Display):** The dashboard shall display top-level Key Performance Indicators (KPIs) in summary cards, including Total Customers, Average Wait Time, Total Served, and Total Skipped/Dropped.
* **FR-DB-003 (Data Visualization):** The dashboard shall include graphical charts (e.g., Line charts for customer volume over time, Pie charts for token status distribution).
* **FR-DB-004 (Global Filtering):** The dashboard shall provide global filters (Date Range, Service Center) that, when applied, automatically update all KPIs and charts simultaneously.
* **FR-DB-005 (Real-Time Sync):** The dashboard shall reflect high-level operational changes (like a sudden surge in queue numbers) periodically or in near real-time without requiring a hard page refresh.

## 3. ⚙️ Non-Functional Requirements
* **NFR-DB-001 (Performance):** The initial load time of the dashboard, including all charts and KPI cards, must not exceed 3 seconds over a standard broadband connection.
* **NFR-DB-002 (Usability):** Information hierarchy must be clear. The dashboard must be fully responsive, readable, and functional on desktop monitors (1080p) and tablet devices.
* **NFR-DB-003 (Security):** Aggregated data displayed on the dashboard must not expose individual customer Personally Identifiable Information (PII).

## 4. 📘 User Guide

### Accessing the Dashboard
1. Log into the **QueueLanka Pro** portal with your Admin credentials.
2. Upon successful login, you will automatically land on the **Admin Dashboard**. (If navigating from elsewhere, click **Dashboard** on the left-side menu).

### Applying Filters
1. Locate the **Filter Bar** at the top of the dashboard.
2. **Date Range:** Click the calendar dropdown to select a specific day, week, month, or custom range.
3. **Service Center:** Use the location dropdown to toggle between "Global View" (All Centers) or select a specific branch (e.g., "Kandy Branch").
4. Once selected, the dashboard elements will automatically refresh to reflect your criteria.

### Using the Dashboard for Decision Making
* **High Average Wait Time:** If the KPI card for Wait Time enters the "Red" zone, consider deploying additional officers to the selected service center immediately.
* **Peak Hour Identification:** Use the "Customer Volume over Time" line chart to predict staff shift requirements for upcoming weeks.

## 5. 📊 Dashboard Features Explanation

* **KPI Cards (Quick Summaries):** 
  * *Total Tokens:* Total number of people who joined the queue.
  * *Average Wait Time:* The average minutes customers spend waiting before being served.
  * *Completion Rate:* Percentage of successfully served customers versus ignored/skipped ones.
* **Charts & Visualizations:**
  * *Trend Line Chart:* Shows arrivals plotted against time of day. Excellent for spotting rush hours.
  * *Status Pie Chart:* A visual breakdown of tokens (e.g., 60% Served, 30% Waiting, 10% Skipped). Shows overall queue health.
  * *Center Comparison Bar Chart:* Compare performance across multiple branches side-by-side.

## 6. 🧪 UAT Test Scenarios

| Scenario ID | Test Scenario | Given | When | Then |
| :--- | :--- | :--- | :--- | :--- |
| **UAT-DB-01** | Role-based Dashboard Access | A user logs in as a Counter Officer | They navigate to the home screen | They are routed to the Officer interface, not the Admin Dashboard. |
| **UAT-DB-02** | Global Filter Application | An Admin is viewing the dashboard showing Global metrics | They select "Colombo Center" from the filter dropdown | All KPI cards and Charts instantly update to display only Colombo center data. |
| **UAT-DB-03** | Date Range Validation | An Admin clicks the Date Range filter | They attempt to select an End Date that is earlier than the Start Date | The system prevents the selection and highlights the field with a validation error. |

## 7. 📊 Validation Checklist
- [ ] Dashboard restricts access strictly to Admin roles.
- [ ] KPI aggregate numbers mathematically match the raw data in the database.
- [ ] Charts render correctly without overlapping text or broken UI elements.
- [ ] Applying a global filter updates *all* widgets on the page, not just one.
- [ ] Dashboard scales gracefully when resizing the browser window.

## 8. ⚠️ Troubleshooting Guide

* **Issue: Charts are blank or show "No Data."**
  * *Solution:* Check the Date Range filter. If you select a future date or a holiday where the center was closed, no data will appear.
* **Issue: The dashboard is loading very slowly.**
  * *Solution:* The default view might be pulling too much historical data. Reduce the default date range filter from "Year-to-Date" to "This Week" or "Today."
* **Issue: I changed the Service Center filter, but the Wait Time KPI didn't change.**
  * *Solution:* Hard refresh your browser (Ctrl+F5). If the issue persists, the selected center might coincidentally have the exact same average time as the previous one. Check the Total Tokens card to verify data actually shifted.

## 9. 🧾 BA Summary
The Admin Dashboard delivers immediate transparency into QueueLanka Pro's operational metrics. By consolidating complex queuing data into intuitive visualizations and top-level KPIs, administrators can swiftly assess branch performance and respond to bottlenecks. The inclusion of dynamic filters ensures the dashboard remains a versatile tool for both daily operational monitoring and long-term capacity planning.

---

## 🎓 Academic / Viva Preparation section

**Q1: From a Business Analysis perspective, how did you determine which KPIs to include on the main dashboard?**
*Answer:* I prioritized KPIs by focusing on the core objectives of any queue system: customer satisfaction and staff efficiency. "Average Wait Time" directly correlates to customer satisfaction, while "Total Served" and "Completed vs Skipped" provide insight into staff productivity. Presenting too many metrics causes cognitive overload, so only the most actionable metrics were placed on the immediate landing view.

**Q2: The dashboard features a "Global Filter". Why is this preferable to having individual filters on every single chart?**
*Answer:* Providing a global page-level filter dramatically improves User Experience (UX). If an Admin wants to review the "Kandy branch," forcing them to apply that filter separately to the KPI cards, the line chart, and the pie chart is repetitive and error-prone. A state-managed global filter guarantees that all dashboard components are looking at the exact same data context simultaneously.

**Q3: How do you handle situations where the dashboard data conflicts with what a local Service Center Manager is experiencing on the ground?**
*Answer:* This usually points to a data latency issue or incorrect status logging. As a BA, I'd investigate the data flow flow from the service center to the central analytics database (e.g., investigating message queues in the WSO2/YARP layer). It could also be a process issue where counter officers are serving people but forgetting to click "Mark as Served" in the system, causing the dashboard to assume long wait times.