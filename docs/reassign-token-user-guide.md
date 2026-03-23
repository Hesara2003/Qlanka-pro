# User Guide: Reassign Token Feature

This guide explains how officers can reassign a customer's token to another counter within the Qlanka-pro system.

## Overview

The **Reassign Token** feature is used when a customer needs to be redirected to a different service point. For example, if a customer was called to the wrong counter or requires a specialized service handled by another officer.

## UI Instructions

### Accessing the Reassign Feature

1.  **Waiting List**: On your officer dashboard, locate the **Waiting Tokens** list.
2.  **Action Menu**: Click the "Reassign" button (typically an arrow or transfer icon) next to the token you wish to move.

### Using the Reassign Token Modal

Once you click Reassign, a modal dialog will appear:

1.  **Target Counter**: Select an open counter from the dropdown list. *Note: Only counters currently marked as "Open" will appear in this list.*
2.  **Reason (Optional)**: Enter a brief explanation for the reassignment (e.g., "Wrong service type selected"). This reason is recorded in the system's audit log for transparency.
3.  **Confirm**: Click **Confirm Reassign** to move the token.

### Visual Feedback

-   **Success Banner**: A notification will appear at the top-right of your screen confirming the token has been successfully moved to the target counter.
-   **Queue Update**: The token will immediately disappear from your waiting list and appear in the target counter's queue.

## Best Practices

-   **Check Availability**: Always ensure the target counter is the correct destination for the customer's needs before confirming.
-   **Communication**: Briefly inform the customer that they are being redirected to a new counter number to ensure they watch the correct display.
-   **Audit Trail**: Providing a reason helps administrators understand queue flow and identify potential service bottlenecks.

## Limitations

-   **Served/Skipped Tokens**: Tokens that have already been marked as "Served" or "Skipped" cannot be reassigned.
-   **Closed Counters**: You cannot reassign a token to a counter that is currently closed.
