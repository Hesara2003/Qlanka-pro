# User Guide: Mark Served & Skip Token Features

This guide explains how officers can manage called tokens by marking them as served or skipped within the Qlanka-pro system.

## Overview

After calling a token, an officer must complete the transaction by either marking the customer as **Served** (service completed) or **Skipped** (customer did not show up). This ensures the queue progresses and statistics are accurately tracked.

## UI Instructions

### The Action Panel

Once a token is called, the **Complete Current Token** panel becomes active on your dashboard.

1.  **Serve Button (Green)**: Use this when you have successfully assisted the customer.
2.  **Skip Button (Amber)**: Use this if the customer is not present at the counter after being called.

### Step-by-Step Workflow

1.  **Select Action**: Click either **Serve** or **Skip**.
2.  **Confirm**: A confirmation dialog will appear below the buttons. 
    - Click **Confirm** to finalize the action.
    - Click **Cancel** if you clicked the wrong button.
3.  **Feedback**:
    - If **Served**: You will see a green success message: *"Token [Number] served successfully"*.
    - If **Skipped**: You will see an amber message: *"Token [Number] skipped"*.
4.  **Next Step**: After the feedback appears, the dashboard resets to the "Ready to Serve" state, allowing you to click **Call Next** for the next customer.

## Best Practices

-   **Prompt Completion**: Mark tokens as served immediately after the transaction to keep the average service time statistics accurate.
-   **Grace Period**: Before skipping a token, ensure you have waited for the locally defined grace period (e.g., 3 announcements).
-   **Recovery**: If you skip a token by mistake, the customer will need to be reassigned or take a new token, as skipped tokens cannot be "un-skipped" directly from the dashboard.

## Real-Time Updates

-   The **Served Count** and **Skipped Count** cards on your dashboard will update immediately.
-   The public display will automatically remove the token from the "Now Serving" list.
-   Other officers in your center will see the updated queue length in real-time.
