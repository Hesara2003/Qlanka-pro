# User Guide: Counter Management (Administrators)

This guide explains how administrators can manage service counters across different service centers in the Qlanka-pro system.

## Overview

The **Counter Management** page allows you to create new counters, assign them to specific service centers, link them with officers, and monitor their real-time operational status (Open/Closed).

## Navigating to Counter Management

1.  Log in to the system with **Administrator** credentials.
2.  From the sidebar or main dashboard, select **Counter Management**.
3.  Use the **Center Filter** at the top to select the service center you wish to manage.

## Managing Counters

### Dashboard Statistics
At a glance, you can see the following metrics for the selected center:
-   **Total Counters**: The overall number of counters configured.
-   **Open**: Counters currently active and serving citizens.
-   **Closed**: Counters currently inactive.

---

### Adding a New Counter

1.  Click the **Add Counter** button in the top right corner.
2.  In the **Create Counter** modal:
    -   **Name**: Provide a clear name or number for the counter (e.g., "Counter 04" or "Express Service").
    -   **Service Center**: Confirm the target center.
    -   **Assign Officer (Optional)**: Select an available officer from the dropdown to link them with this counter.
3.  Click **Create** to finalize.

---

### Opening and Closing Counters

You can control the availability of any counter using the toggle on its card:

1.  **Opening a Counter**: Simply toggle the status to **Open**. The counter will immediately become available in the live queue for citizens to see.
2.  **Closing a Counter**:
    -   Toggle the status to **Closed**.
    -   A **Close Counter** modal will appear.
    -   **Reason (Optional)**: Provide a reason for closing (e.g., "Lunch Break" or "Shift End").
    -   **Warning**: If there is a citizen currently at the counter, a warning will be displayed before you confirm the closure.

---

## Best Practices

-   **Officer Assignment**: Always ensure the correct officer is assigned to the counter before they start their shift to ensure accurate reporting.
-   **Timely Closures**: Close counters as soon as a shift ends or a break begins to maintain accurate "Estimated Wait Time" calculations for citizens.
-   **Naming Convention**: Use consistent naming (e.g., "Counter 01", "Counter 02") to make it easy for citizens to find their assigned location.
