# SCRUM-165/166/167/168/169/173/174/175/187 - Validation and Test Guidance

## Purpose
This document summarizes:
1. What was checked.
2. What is included in the implemented test coverage.
3. Available test outputs.
4. Production validation outcomes and remaining follow-up actions.

## Scope Checked
- SCRUM-165: JMeter scenario design for booking surge, queue polling, websocket updates.
- SCRUM-166: Parameterized JMeter plans and externalized config/data files.
- SCRUM-167: Dataset specification and seed/reset workflow for reproducibility.
- SCRUM-168: Baseline execution artifacts from staging run.
- SCRUM-169: Parsed metrics report (p95 and error rate).
- SCRUM-173: Playwright citizen booking E2E implementation.
- SCRUM-174: Playwright officer call-next/serve/skip E2E implementation.
- SCRUM-175: Playwright live queue concurrent update E2E implementation.
- SCRUM-187: Playwright authentication and booking rate-limit E2E implementation.

## Included Test Coverage

### SCRUM-165/166/167/168/169 (JMeter)
Implemented and documented in:
- [tests/jmeter/booking-surge.jmx](tests/jmeter/booking-surge.jmx)
- [tests/jmeter/queue-polling.jmx](tests/jmeter/queue-polling.jmx)
- [tests/jmeter/websocket-updates.jmx](tests/jmeter/websocket-updates.jmx)
- [artifacts/perf/jmeter/summary-20260405-112927.json](artifacts/perf/jmeter/summary-20260405-112927.json)

Coverage includes:
- Booking surge load profile with auth and booking requests.
- Queue polling profile with repeated token/booking reads.
- WebSocket/SignalR connect and subscription flow.
- Reproducible configuration through properties + CSV datasets.
- Reportable outputs for latency and error-rate metrics.

### SCRUM-173 (Citizen Booking E2E)
Implemented in:
- [QueueLanka.SmokeTests/tests/citizen-booking.e2e.test.ts](QueueLanka.SmokeTests/tests/citizen-booking.e2e.test.ts)

Checks include:
- Citizen login.
- Open booking page for a center.
- Date and time slot selection behavior.
- Submit disabled/enabled state transitions.
- Successful booking confirmation UI assertions.
- Backend verification through GET /api/appointment/my-bookings.

### SCRUM-174 (Officer Flow E2E)
Implemented in:
- [QueueLanka.SmokeTests/tests/officer-call-next.e2e.test.ts](QueueLanka.SmokeTests/tests/officer-call-next.e2e.test.ts)

Checks include:
- Officer login.
- Waiting queue count verification.
- Call Next transition.
- Serve transition with served-count assertion.
- Skip transition with skipped-count assertion.
- Backend dashboard verification through GET /api/counters/{counterId}/dashboard.

### SCRUM-175 (Live Queue Update E2E)
Implemented in:
- [QueueLanka.SmokeTests/tests/live-queue-updates.e2e.test.ts](QueueLanka.SmokeTests/tests/live-queue-updates.e2e.test.ts)

Checks include:
- Parallel browser contexts (citizen + citizen + officer).
- WebSocket connection observation on /hubs/queue.
- Live queue current-token and waiting-count sync checks.
- Officer actions reflected across citizen views.
- Backend dashboard state validation after transitions.

### SCRUM-187 (Auth + Rate Limit E2E)
Implemented in:
- [QueueLanka.SmokeTests/tests/auth-and-ratelimit.e2e.test.ts](QueueLanka.SmokeTests/tests/auth-and-ratelimit.e2e.test.ts)

Checks include:
- Protected endpoint rejects unauthenticated requests.
- Citizen forbidden from officer dashboard endpoint.
- Officer authorized for officer dashboard endpoint.
- Booking endpoint rate limit enforced (6th request returns 429 for same client IP partition).

## Available Test Outputs

### JMeter Output (Executed)
Source artifacts:
- [artifacts/perf/jmeter/summary-20260405-112927.json](artifacts/perf/jmeter/summary-20260405-112927.json)

Extracted results:
- Booking surge: 312 requests, p95 435 ms, error rate 100%.
- Queue polling: 125 requests, p95 561 ms, error rate 100%.
- Websocket updates: 24 requests, p95 2793 ms, error rate 100%.
- Aggregate: 461 requests, p95 547 ms, error rate 100%.

Interpretation:
- This run captured staging outage behavior (403 Site Disabled / TLS issues), not application throughput baseline.

### Playwright Output (Current Recorded State)
- [QueueLanka.SmokeTests/test-results/.last-run.json](QueueLanka.SmokeTests/test-results/.last-run.json) currently reflects an older local run state.
- Cross-machine validation (another development PC) confirmed the previously failing tests now execute successfully with the current test-side hardening changes.
- No `playwright-report` folder is currently present in this workspace snapshot.

Interpretation:
- The Playwright suite implementation is present, and cross-machine execution confirms effective pass behavior for the earlier local failures.

### Production Validation Run (Latest)

Execution context:
- Environment: Production.
- Scope: SCRUM-173, SCRUM-174, SCRUM-175, SCRUM-187 Playwright E2E suite.

Production run result:
- 22 tests discovered.
- 20 passed.
- 0 failed.
- 2 not run.

Assessment:
- Implemented test cases are validated as passed in production execution.
- The 2 not-run tests are treated as pending execution and not as failed outcomes.

## Remaining Follow-Up Actions

### 1) Execute the 2 Not-Run Tests
- Re-run the two skipped/not-run scenarios in production-aligned conditions.
- Capture pass/fail output and attach artifacts.

### 2) Preserve Evidence for Audit
- Keep Playwright reports, logs, and screenshots as execution evidence.
- Archive production run timestamp, operator, and environment metadata.

### 3) Keep JMeter Baseline Classification Explicit
- Retain existing outage/local performance runs as historical diagnostics.
- Publish a clean production/staging baseline run if performance sign-off is required.

## Recommended Next Validation Run
1. Execute the 2 not-run tests in production-aligned environment.
2. Save and retain:
   - `test-results`
   - `playwright-report`
3. Update this document with final completion status (22/22 executed).

## Note
This document now reflects the latest production validation update: 20 tests passed, 2 tests not run, 0 failures.