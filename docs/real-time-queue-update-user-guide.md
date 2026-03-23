# User Guide: Real-time Queue Updates

This guide explains how the Qlanka-pro system keeps your dashboard synchronized with the central queue in real-time, ensuring you always have the most up-to-date information without needing to refresh your browser.

## How it Works

Qlanka-pro uses **SignalR** technology to push updates directly to your browser as they happen. This means:
- When a new customer joins the queue, they appear on your list immediately.
- When an admin reassigns a token, it moves between counters instantly.
- Statistics like "Served Today" update the moment you complete a transaction.

## Connection Status Indicators

The system provides visual cues to let you know the state of your real-time connection:

1.  **Connected**: All systems are active. Updates are being received in real-time.
2.  **Connecting/Reconnecting**: The system is attempting to establish a connection. You may see a brief spinner or status message.
3.  **Disconnected**: The connection was lost (e.g., internet failure). The dashboard will transition to "Offline Mode" and attempt to reconnect automatically.

## Automatic Recovery (Reconnection)

If your internet connection drops momentarily, the system is designed to recover gracefully:

-   **Exponential Backoff**: The system will try to reconnect multiple times, increasing the wait time between each attempt (from 1 second up to 30 seconds).
-   **Page Visibility**: If you switch tabs or minimize the browser, the system may pause and then automatically reconnect as soon as you bring the Qlanka-pro tab back to the front.
-   **Manual Refresh**: While the system handles most reconnections automatically, if you see a "Disconnected" message for more than a minute, you can perform a manual page refresh (F5) to force a full state synchronization.

## Benefits for Officers

-   **Zero-Latency Service**: Call the next customer instantly as they appear in the queue.
-   **No Duplicated Efforts**: See when another officer has already called or skipped a token, preventing multiple officers from trying to serve the same citizen.
-   **Accurate Stats**: Watch your performance metrics update live as you work through your shift.
