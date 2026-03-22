<!-- docs/sprints/websocket-load-test-plan.md -->

# WebSocket Load Test Plan (SignalR, 50 Concurrent Clients)

## Objective
Validate that QueueLanka Queue service supports at least 50 concurrent SignalR clients receiving scoped queue updates with stable latency and no server-side failures.

## Scope
- Hub endpoint: `/hubs/queue`
- Group model:
  - Citizen-visible events -> `queue-{centerId}`
  - Officer queue updates -> `counter-{counterId}`
- Event types under load:
  - `call-next`
  - `served`
  - `skipped`
  - `cancel`

## Prerequisites
- Queue service running with metrics enabled and Prometheus scraping configured.
- JMeter setup available in project test tooling environment.
- Test tokens/counters seeded for a target center.

## JMeter Plan (50 Concurrent SignalR Connections)
1. Create a Thread Group with:
   - Number of Threads (users): `50`
   - Ramp-up period: `20-30s`
   - Loop Count: `1` for connection soak, or time-based scheduler for `5-10 min`.
2. Use a WebSocket/SignalR-compatible JMeter sampler plugin.
3. For each virtual user:
   - Connect to `/hubs/queue`.
   - Perform SignalR negotiate + connect workflow.
   - Invoke `JoinCenterGroup(centerId)` and/or `JoinCounterGroup(counterId)`.
4. Trigger backend actions (API calls) during active connections:
   - Call next token
   - Mark token served
   - Mark token skipped
   - Cancel token
5. Capture metrics:
   - Connection success/failure count
   - Message receive latency (p50/p95)
   - Disconnect/reconnect count
   - Error responses and hub exceptions

## Expected Behavior at 50 Clients
- All 50 clients establish and maintain WebSocket/SignalR connections.
- Broadcasts are group-scoped (no global fan-out):
  - `queue-{centerId}` receives call-next/served/skipped/cancel events.
  - `counter-{counterId}` receives counter-specific queue updates.
- Broadcast failures are logged but do not fail API operations.
- No sustained increase in handshake failures, timeout disconnects, or memory spikes.

## Prometheus Monitoring Guidance
Track these indicators during the run:
- Active SignalR/WebSocket connections (current value and max observed)
- Request rate and error rate for hub/API endpoints
- CPU and memory usage of Queue service container/pod
- GC pressure and thread pool saturation signals

Suggested checks:
- Connection count remains near expected concurrent clients.
- Error rate stays near baseline.
- Resource usage remains within safe operating thresholds.

## Scale Beyond 50 Clients
If expected concurrency increases significantly:
- Use Azure SignalR Service to offload connection management and fan-out.
- For multi-instance self-hosting, adopt Redis backplane to synchronize group messaging.
- Keep explicit CORS origins and credentialed connections.
- Re-run load tests at 100/250/500 clients with gradual ramp-up and soak windows.

## Pass/Fail Criteria
Pass when all are true:
- >= 50 clients remain connected throughout test window.
- Group-scoped events are delivered correctly for all four event types.
- No broadcast exception propagates to HTTP responses.
- No critical errors or service restarts under planned load.
