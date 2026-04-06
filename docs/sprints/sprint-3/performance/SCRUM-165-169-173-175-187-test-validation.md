# SCRUM-165/166/167/168/169/173/174/175/187 - Validation and Test Guidance

## Purpose
This document summarizes:
1. What was checked.
2. What is included in the implemented test coverage.
3. Available test outputs.
4. Guidance on development work needed to make failed or blocked tests pass.

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

### Local Development Run (Executed in This Session)

JMeter local-mode run parameters:
- `protocol=http`
- `host=localhost`
- `port=5000`
- shortened hold/ramp values for interactive validation

Local run results (after gateway was rewired to local upstream services and users were seeded):
- Booking surge: 8,582 requests, avg 403 ms, min 1 ms, max 7000 ms, error rate 74.88%.
- Queue polling: 3,531 requests, avg 2777 ms, min 1 ms, max 15020 ms, error rate 62.16%.
- Websocket updates: 150 requests, avg 388 ms, min 3 ms, max 2448 ms, error rate 83.33%.

Playwright local-mode run parameters:
- `SMOKE_BASE_URL=http://localhost:5000`
- `API_BASE_URL=http://localhost:5000`
- `UI_BASE_URL=http://localhost:3000`

Local run result:
- 22 tests discovered.
- 11 passed, 9 failed, 2 did not run.

Cross-machine rerun update (latest validation):
- Previously failing tests were rerun on another development PC and passed.
- Current assessment for SCRUM-173/174/175/187 implementation status: functionally validated.
- Residual differences are treated as local-environment/data-state sensitivity, not confirmed test logic regressions.

Resolved blockers in this session:
- Backend preflight endpoint is reachable via gateway.
- Smoke users (`healthcheck_admin`, `healthcheck_citizen`) were verified and can log in successfully.
- Playwright Chromium binary was installed for local browser E2E execution.

Environment note:
- `docker` was not installed in this environment during the local run captured above, so the full compose stack could not be started here.
- Services were started directly with `dotnet run` and gateway reverse-proxy destinations were overridden to localhost.
- Cross-machine passing results indicate the remaining local issues were environment-specific for this workstation.

## Guidance to Make Failed/Blocked Tests Pass

### 1) Environment Readiness (Highest Priority)
Required before reruns:
- Ensure gateway is healthy at http://localhost:5000/health.
- Ensure frontend is reachable at http://localhost:3000.
- Ensure Queue service hub route /hubs/queue is reachable through gateway.

Why this matters:
- Both JMeter and Playwright failures are heavily environment-dependent.
- Unavailable services will produce false negatives.

### 2) Data and Identity Preconditions
Ensure test setup can reliably create and use:
- Admin user (for center/counter provisioning).
- Officer user assigned to created counter.
- Citizen users with valid credentials.
- Open counter status before officer actions.

If failures occur here, verify:
- /api/auth/register role constraints.
- /api/admin/centers/{centerId}/counters creation and assignment behavior.
- /api/admin/centers/{centerId}/counters/{counterId}/status endpoint permissions.

### 3) Live Queue Assertions and Event Timing
Potential flaky area:
- Real-time UI checks can fail if signal propagation lags.

Recommended hardening if needed:
- Increase expectation timeouts for websocket-driven assertions.
- Add explicit waits for queue state transitions after officer actions.
- Validate fallback behavior if /api/token/center/{id}/queue is unavailable.

### 4) Rate-Limit Determinism
Potential mismatch area:
- Booking rate-limit test assumes IP partitioning via X-Forwarded-For.

If assertions fail:
- Confirm gateway policy still limits POST /api/appointment/book at 5 per minute.
- Confirm gateway trusts/uses X-Forwarded-For in local environment.
- Ensure no additional booking attempts in same minute consume quota before the test assertion.

### 5) Frontend Selector Stability
Implemented test IDs already cover critical controls and result views.
If tests break after UI refactors:
- Preserve data-testid anchors used in Playwright tests.
- Avoid replacing key test IDs without updating test selectors.

### 6) JMeter Baseline Re-Run Requirement
To convert SCRUM-168/169 into a valid performance baseline:
- Re-run all three JMeter plans after staging is fully available.
- Generate a fresh summary JSON and compare to outage run.
- Only treat the re-run metrics as capacity/performance baseline.

## Recommended Next Validation Run
1. Start docker-compose stack and wait for healthy gateway/frontend.
2. Run Playwright E2E: `npx playwright test tests/*.e2e.test.ts`
3. Save and retain:
   - `test-results`
   - `playwright-report`
4. Re-run JMeter scenarios on available staging/local env.
5. Update this document with actual rerun pass/fail and metric deltas.

## Note
The Playwright implementation has been executed locally and additionally validated on another development PC where previously failing tests passed. This document preserves local-run diagnostics and records the latest cross-machine validation outcome.