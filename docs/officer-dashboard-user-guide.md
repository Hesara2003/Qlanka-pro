# User Guide: Officer Dashboard

This guide introduces the Qlanka-pro Officer Dashboard, your central hub for managing customer queues and service operations.

## Dashboard Overview

The dashboard is designed for high-efficiency queue management, providing real-time visibility into your counter's performance and waiting list.

### 1. Statistics Cards (Top)
Provides a snapshot of your daily performance:
- **Served Today**: Total number of citizens you have successfully assisted.
- **Skipped Today**: Total number of citizens who did not show up.
- **Average Service Time**: The average duration (in minutes/seconds) of your completed transactions.

### 2. Action Panel (Left)
Where you initiate and finalize customer service:
- **Call Next Button**: Pulls the next citizen from the waiting list.
- **Serve Button**: Finalizes the current transition as successfully completed.
- **Skip Button**: Marks the current token as skipped if the citizen is unavailable.

### 3. Current Token Display (Right)
Shows the details of the citizen currently at your counter:
- **Token Number**: Large hero display of the called token (e.g., A001).
- **Status**: Current lifecycle status of the token.
- **Timestamps**: When the token was issued and when you called it.

### 4. Waiting Tokens List (Bottom)
A real-time list of upcoming citizens:
- **Queue Position**: Indicates the order of service.
- **Estimated Wait Time**: Calculated based on your average service speed.
- **Reassign Action**: Allows you to transfer a citizen to another counter if needed.

## Usage Workflow

1.  **Open Counter**: (Handled by Admin/Manager) Ensure your counter shows as "Open" on the dashboard.
2.  **Call Citizen**: Press the **Call Next** button to pull the first person from the waiting list.
3.  **Announce**: The token number will appear on the dashboard and public display. Wait for the citizen to arrive.
4.  **Complete Service**: Once the citizen is assisted, click **Serve** and follow the confirmation prompt.
5.  **Handle Absences**: If the citizen does not show up, click **Skip** and confirm.
6.  **Progress**: Immediately after serving or skipping, the dashboard resets, allowing you to click **Call Next** again.

## Real-Time Features

The dashboard updates automatically without needing a page refresh:
- **Queue Changes**: When a new citizen joins the queue, they appear instantly.
- **Cancellations**: If a citizen cancels their token, it disappears from your list.
- **Reassignments**: If an admin moves a token to your counter, it will appear in your waiting list in the correct position.
