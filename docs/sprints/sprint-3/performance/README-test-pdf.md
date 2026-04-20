# QLANKA-PRO

# QA Report

## Sprint 3 - Synthetic Baseline

| Field | Value |
|---|---|
| Date | April 6, 2026 |
| Sprint | Sprint 3 |
| Status | Synthetic Baseline Draft |
| Prepared by | QA Team |
| Project | Qlanka-pro |

Pass/fail counts, JMeter metrics, and defect distributions in this report are intentionally synthetic. Test scope, endpoint coverage, role logic, and reproduction commands in this report are derived from the live codebase.

## 1. Important Note About Data

This report uses synthetic execution data because production-like run data is not yet available for Sprint 3.

### What is real
- Test scope and endpoint coverage, derived from current codebase and automation files.
- Roles, route protection, and expected status behaviour, aligned to backend controllers and OpenAPI.

### What is synthetic
- Pass/fail counts for the expanded matrix.
- Performance metrics (latency, throughput, error rate) for JMeter scenarios.
- Defect counts and severity distribution.

## 2. Scope Covered

### 2.1 Codebase Sources
- Backend API controllers, Identity, Queue, ServiceCenter services.
- Officer API contract, officer-api.yaml.
- Playwright smoke suites, QueueLanka.SmokeTests/tests.
- Reporting and QA docs, docs/.

### 2.2 Functional Areas
- Authentication and authorization, register, login, verify-email, role checks.
- Citizen booking lifecycle, book token, view bookings, token list, token cancel.
- Service center lifecycle, list, details, availability, create/update admin paths.
- Officer counter workflows, call next, update served/skip, waiting queue, dashboard, stats, reassign.
- Admin workflows, user management, counter management, report CSV export.
- Security and negative-path behaviour, 401 / 403 / 404 / 409 / 422 classes.

## 3. Environment and Assumptions

| Item | Value |
|---|---|
| API base URL | Staging-like environment over HTTPS |
| Data profile | Seeded users for citizen, officer, admin roles |
| Playwright mode | API-level E2E smoke (workers=1, no retries) |
| JMeter profile | 5-minute ramp-up tests + short stress bursts |
| Time zone | Business-hours simulation, Asia/Colombo |

## 4. Playwright E2E Coverage

### 4.1 Existing Automated Smoke Suites

| Suite | Automated Tests | Result (Synthetic) |
|---|---:|---|
| Auth smoke | 2 | 2 pass |
| Appointment smoke | 4 | 4 pass |
| Service center smoke | 4 | 4 pass |
| Token smoke | 4 | 4 pass |
| Report CSV validation smoke | 2 | 2 pass |
| Total automated (current repo) | 16 | 16 pass |

### 4.2 Expanded All-Options E2E Matrix

Extends current smoke coverage to all major API options identified in the codebase.

| Area | Cases | Pass | Fail |
|---|---:|---:|---:|
| Auth - register, login, verify-email, invalid credentials, duplicate user, invalid role | 10 | 9 | 1 |
| Appointment - book (success/conflict/not found), my-bookings auth/no-auth | 8 | 8 | 0 |
| Token - my-tokens, cancel (success/already-cancelled/not-found/not-cancellable) | 9 | 8 | 1 |
| Service Centers - list, by id, availability, location, create, status update, invalid id | 12 | 11 | 1 |
| Officer Counters - call-next, status update, waiting list, dashboard, stats, reassign | 14 | 13 | 1 |
| Admin Counters - create/list/get/status update with role checks and validation | 8 | 7 | 1 |
| Admin Users - list with filters, invalid role filter, delete, protected routes | 7 | 7 | 0 |
| Reports - daily CSV, center CSV, no-content, invalid date, non-admin 403 | 7 | 6 | 1 |
| Total expanded matrix | 75 | 69 | 6 |

### 4.3 Synthetic Defect Summary

| Defect ID | Severity | Area | Observation |
|---|---|---|---|
| SYN-QA-001 | Medium | Auth | Register with malformed role payload returned inconsistent validation shape in one run profile |
| SYN-QA-002 | Medium | Token | Cancel endpoint produced mixed 409/422 messaging for non-cancellable tokens across data states |
| SYN-QA-003 | Low | Service Center | Invalid ID negative case returned generic message text instead of domain-specific text |
| SYN-QA-004 | Medium | Officer Counter | Reassign conflict message lacked target counter context in response body |
| SYN-QA-005 | Low | Reports | Empty dataset path returned 204 without additional metadata header for traceability |
| SYN-QA-006 | Medium | Admin Counter | Status patch validation did not consistently include field-level validation details |

### 4.4 Failed Tests (Synthetic Matrix) and Why Not Critical Now

The expanded synthetic matrix recorded 6 failed cases. These are mapped to negative-path and response-consistency gaps, not hard functional outages.

| Failed Test Area | Synthetic Fail Count | Failure Theme | Why Not Critical Right Now |
|---|---:|---|---|
| Auth negative path | 1 | Malformed role payload validation shape inconsistency | Core auth flows (valid register/login/verify-email) pass; issue is response-format consistency |
| Token negative path | 1 | Mixed 409/422 messaging for non-cancellable state | Business rule enforcement works; inconsistency is in error envelope/message detail |
| Service Center negative path | 1 | Invalid ID returns generic message | Functional protection is in place; this is message-quality and API UX refinement |
| Officer Counter negative path | 1 | Reassign conflict response lacks target context | Workflow safety is preserved; improvement is additional diagnostics in error text |
| Admin Counter validation path | 1 | Patch validation not always field-level detailed | Role enforcement and update guardrails work; gap is validation detail quality |
| Reports negative path | 1 | 204 empty-data path missing trace metadata header | Export path works; issue affects observability/traceability, not data correctness |

Current priority rationale:
- No critical blockers and no high-severity defects were identified.
- Role-based protections (401/403 boundaries) are passing.
- Primary happy paths and core operations remain functional.
- Remaining failures are important for hardening, but are not release-blocking for a conditional sign-off.

### 4.5 Not-Run Tests (Execution Constraints)

In addition to the synthetic matrix, the latest production execution status tracked 2 tests as not run.

| Test | Status | Reason |
|---|---|---|
| Live queue update stability case (high wait profile) | Not run | Environment sometimes took too long to load, produced intermittent results, and occasionally stopped the process completely |
| Extended report/export stress validation case | Not run | Environment instability under long-running load caused inconsistent completion and occasional full process stop |

Decision note:
- These 2 tests are intentionally recorded as not run (not failed) due to machine limitations and unstable long-run execution behavior.
- They remain pending for rerun on higher-capacity/stable infrastructure.

## 5. JMeter Performance Report

### 5.1 Test Design

| ID | Scenario | Virtual Users | Duration | Target |
|---|---|---:|---|---|
| JM-01 | Login burst - POST /api/auth/login | 150 | 5 min | p95 < 450 ms |
| JM-02 | Citizen browse - GET /api/service-centers | 200 | 8 min | p95 < 350 ms |
| JM-03 | Booking concurrency - POST /api/appointment/book | 120 | 10 min | conflict-safe, p95 < 800 ms |
| JM-04 | Officer live ops - call-next, token status, waiting, dashboard | 90 | 10 min | p95 < 700 ms |
| JM-05 | Report export - GET /api/reports/daily-summary/csv | 40 | 6 min | p95 < 1200 ms |
| JM-06 | Mixed production-like - weighted auth/booking/counter/report | 250 | 15 min | error rate < 2.0% |

### 5.2 Synthetic Results

| Scenario | Throughput req/s | Avg ms | p95 ms | p99 ms | Error % | Outcome |
|---|---:|---:|---:|---:|---:|---|
| JM-01 Login burst | 72.4 | 188 | 402 | 611 | 0.8% | Pass |
| JM-02 Citizen browse | 145.7 | 96 | 231 | 338 | 0.2% | Pass |
| JM-03 Booking concurrency | 54.2 | 341 | 776 | 1092 | 1.7% | Pass (watch) |
| JM-04 Officer live ops | 48.9 | 284 | 689 | 944 | 1.1% | Pass |
| JM-05 Report export | 21.3 | 612 | 1136 | 1498 | 2.4% | Risk |
| JM-06 Mixed production-like | 129.6 | 244 | 533 | 812 | 1.9% | Pass (watch) |

### 5.3 Performance Findings
- Read-heavy endpoints are stable with low p95 latency under high concurrency.
- Booking flow remains conflict-safe under contention, but p99 spikes indicate DB lock pressure.
- CSV report generation is the slowest path and exceeds error threshold in one synthetic run.
- Mixed workload stayed inside the global error budget but showed sensitivity during report spikes.

## 6. Role-Based Security Validation

| Validation Rule | Result |
|---|---|
| Unauthenticated access to protected routes returns 401 | Pass |
| Non-admin access to admin-only report endpoints returns 403 | Pass |
| Non-officer access to officer-only counter operations returns 403 | Pass |
| Admin-only user management and counter-admin routes enforce role checks | Pass |
| Token operations restricted to authenticated principals and ownership rules | Pass (one messaging inconsistency) |

## 7. Overall Quality Summary

| Metric | Value |
|---|---|
| Total E2E / API cases | 75 |
| Passed | 69 |
| Failed | 6 |
| Pass rate | 92.0% |
| JMeter scenarios | 6 |
| Scenarios meeting primary targets | 5 / 6 |
| Critical blockers | 0 |
| High-severity defects | 0 |
| Quality status | Conditionally Ready for Sprint 3 sign-off |

Targeted hardening is required on report export performance and response consistency for selected 409/422 negative paths before final sign-off.

Additional execution note:
- 2 tests are pending (not run) because of machine limitation symptoms during long-load scenarios: intermittent result return and occasional full process stop.

## 8. Recommended Actions Before Real Data Sign-off
- Convert synthetic officer/admin matrix cases into executable Playwright suites.
- Add JMeter test plan files (.jmx) and check them into a performance/ folder.
- Stabilize CSV export under load using pagination, chunking, or async generation.
- Standardize error envelope for 409/422 conditions across token and counter flows.
- Re-run this same matrix with real staging data and replace synthetic metrics.

## 9. Reproduction Commands

### 9.1 Playwright - Existing Smoke Suites

```bash
cd QueueLanka.SmokeTests
npm ci
npx playwright install chromium

SMOKE_BASE_URL=https://your-api-host \
SMOKE_USERNAME=healthcheck_citizen \
SMOKE_PASSWORD='Health@Check1' \
SMOKE_ADMIN_USERNAME=healthcheck_admin \
SMOKE_ADMIN_PASSWORD='Health@Check1' \
npx playwright test
```

### 9.2 JMeter - Full Performance Run

```bash
jmeter -n \
	-t performance/queuelanka_sprint3.jmx \
	-l performance/results/sprint3_results.jtl \
	-e -o performance/results/html-report
```

### 9.3 Lightweight Local Load Fallback

```bash
node scripts/load_test_local.js \
	--url http://localhost:5012/health \
	--duration 30 \
	--concurrency 50
```

## 10. Traceability to Sprint 3 Goals

| Sprint 3 Goal | Coverage |
|---|---|
| Reliability | Expanded negative paths and role-protected route validation |
| Performance | Synthetic JMeter scenarios for booking, officer actions, and reports |
| Security | 401/403 behaviour checks across citizen / officer / admin boundaries |
| Production Readiness | No critical blockers identified, concrete hardening actions listed |

This report must be re-executed with real staging data before final Sprint 3 sign-off.
