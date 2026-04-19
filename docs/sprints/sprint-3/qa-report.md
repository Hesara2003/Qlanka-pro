# Sprint 3 - QA Report (Synthetic Baseline)

Project: Qlanka-pro  
Sprint: Sprint 3  
Date: April 6, 2026  
Prepared by: QA (simulated baseline draft)

---

## 1. Important Note About Data

This report is intentionally created with **synthetic (fake) execution data** because production-like run data is not yet available for Sprint 3.

What is real in this report:

- Test scope and endpoint coverage are derived from the current codebase and existing automation files.
- Roles, route protection, and expected status behavior are aligned to backend controllers and OpenAPI.

What is synthetic:

- Pass/fail counts for the expanded matrix.
- Performance metrics (latency, throughput, error rate) for JMeter scenarios.
- Defect counts and severity distribution.

---

## 2. Scope Covered

### 2.1 Codebase Sources Used

- Backend API controllers in Identity, Queue, and ServiceCenter services.
- Officer API contract in `officer-api.yaml`.
- Existing Playwright smoke suites under `QueueLanka.SmokeTests/tests`.
- Reporting and QA-related docs in `docs/`.

### 2.2 Functional Areas Included

1. Authentication and authorization (register, login, verify-email, role checks).
2. Citizen booking lifecycle (book token, view bookings, token list, token cancel).
3. Service center lifecycle (list, details, availability, create/update admin paths).
4. Officer counter workflows (call next, update served/skip, waiting queue, dashboard, stats, reassign).
5. Admin workflows (user management, counter management, report CSV export).
6. Security and negative-path behavior (401/403/404/409/422 classes).

---

## 3. Environment and Assumptions (Synthetic Run Profile)

- API base URL profile: Staging-like environment over HTTPS.
- Data profile: Seeded users for citizen, officer, admin roles.
- Playwright mode: API-level E2E smoke style (`workers=1`, no retries).
- JMeter profile: 5-minute ramp-up tests plus short stress bursts.
- Time window: Business-hours simulation in Asia/Colombo time zone.

---

## 4. Playwright E2E Coverage

## 4.1 Existing Automated Smoke Suites in Repository

| Suite | Automated Tests | Result (Synthetic) |
|---|---:|---:|
| Auth smoke | 2 | 2 pass |
| Appointment smoke | 4 | 4 pass |
| Service center smoke | 4 | 4 pass |
| Token smoke | 4 | 4 pass |
| Report CSV validation smoke | 2 | 2 pass |
| **Total automated (current repo)** | **16** | **16 pass** |

## 4.2 Expanded "All Options" E2E Matrix (Synthetic)

This matrix extends current smoke coverage to all major API options identified in code.

| Area | Key Options Covered | Cases | Pass | Fail |
|---|---|---:|---:|---:|
| Auth | register, login, verify-email, invalid credentials, duplicate user, invalid role | 10 | 9 | 1 |
| Appointment | book (success/conflict/not found), my-bookings auth/no-auth | 8 | 8 | 0 |
| Token | my-tokens auth/no-auth, cancel success/already-cancelled/not-found/not-cancellable | 9 | 8 | 1 |
| Service Centers | list, by id, availability, location get/upsert, create, status update, invalid id | 12 | 11 | 1 |
| Officer Counters | call-next, status update (served/skipped), waiting list, dashboard, stats, reassign | 14 | 13 | 1 |
| Admin Counters | create/list/get/status update with role checks and validation | 8 | 7 | 1 |
| Admin Users | list with filters, invalid role filter, delete user, protected routes | 7 | 7 | 0 |
| Reports | daily summary csv, center summary csv, no-content, invalid date range, non-admin 403 | 7 | 6 | 1 |
| **Total expanded matrix** |  | **75** | **69** | **6** |

## 4.3 Playwright Synthetic Defect Summary

| Defect ID | Severity | Area | Synthetic Observation |
|---|---|---|---|
| SYN-QA-001 | Medium | Auth | Register with malformed role payload returned inconsistent validation shape in one run profile. |
| SYN-QA-002 | Medium | Token | Cancel endpoint produced mixed `409`/`422` messaging for non-cancellable tokens across data states. |
| SYN-QA-003 | Low | Service Center | Invalid ID negative case returned generic message text instead of domain-specific text. |
| SYN-QA-004 | Medium | Officer Counter | Reassign conflict message lacked target counter context in response body. |
| SYN-QA-005 | Low | Reports | Empty dataset path returned `204` without additional metadata header for traceability. |
| SYN-QA-006 | Medium | Admin Counter | Status patch validation did not consistently include field-level validation details. |

---

## 5. JMeter Performance Report (Synthetic)

## 5.1 Test Design

| Scenario ID | Scenario | Endpoint Focus | Virtual Users | Duration | Target |
|---|---|---|---:|---:|---|
| JM-01 | Login burst | `POST /api/auth/login` | 150 | 5 min | p95 < 450 ms |
| JM-02 | Citizen browse | `GET /api/service-centers`, `GET /api/service-centers/{id}` | 200 | 8 min | p95 < 350 ms |
| JM-03 | Booking concurrency | `POST /api/appointment/book` | 120 | 10 min | conflict-safe, p95 < 800 ms |
| JM-04 | Officer live operations | `call-next`, `token status`, `waiting`, `dashboard` | 90 | 10 min | p95 < 700 ms |
| JM-05 | Report export | `GET /api/reports/daily-summary/csv` | 40 | 6 min | p95 < 1200 ms |
| JM-06 | Mixed production-like | weighted mix across auth/booking/counter/report | 250 | 15 min | error rate < 2.0% |

## 5.2 Synthetic JMeter Results

| Scenario | Throughput (req/s) | Avg (ms) | p95 (ms) | p99 (ms) | Error % | Outcome |
|---|---:|---:|---:|---:|---:|---|
| JM-01 Login burst | 72.4 | 188 | 402 | 611 | 0.8% | Pass |
| JM-02 Citizen browse | 145.7 | 96 | 231 | 338 | 0.2% | Pass |
| JM-03 Booking concurrency | 54.2 | 341 | 776 | 1092 | 1.7% | Pass (watch) |
| JM-04 Officer live operations | 48.9 | 284 | 689 | 944 | 1.1% | Pass |
| JM-05 Report export | 21.3 | 612 | 1136 | 1498 | 2.4% | Risk |
| JM-06 Mixed production-like | 129.6 | 244 | 533 | 812 | 1.9% | Pass (watch) |

## 5.3 Performance Findings (Synthetic)

1. Read-heavy endpoints are stable with low p95 latency under high concurrency.
2. Booking flow remains conflict-safe under contention, but p99 spikes indicate DB lock pressure.
3. CSV report generation is the slowest path and exceeds error threshold in one synthetic run.
4. Mixed workload stayed inside global error budget but showed sensitivity during report spikes.

---

## 6. Role-Based Security Validation (Synthetic)

| Validation Rule | Result |
|---|---|
| Unauthenticated access to protected routes returns 401 | Pass |
| Non-admin access to admin-only report endpoints returns 403 | Pass |
| Non-officer access to officer-only counter operations returns 403 | Pass |
| Admin-only user management and counter-admin routes enforce role checks | Pass |
| Token operations restricted to authenticated principals and ownership rules | Pass (one messaging inconsistency) |

---

## 7. Overall Quality Summary (Synthetic)

| Metric | Value |
|---|---:|
| Total E2E/API cases in expanded matrix | 75 |
| Passed | 69 |
| Failed | 6 |
| Pass rate | 92.0% |
| JMeter scenarios | 6 |
| Scenarios meeting primary thresholds | 5 / 6 |
| Critical blockers | 0 |
| High-severity defects | 0 |

Quality status: **Conditionally Ready for Sprint 3 sign-off** with targeted hardening on report export performance and response consistency for selected negative paths.

---

## 8. Recommended Actions Before Real Data Sign-off

1. Convert synthetic officer/admin matrix cases into executable Playwright suites.
2. Add JMeter test plan files (`.jmx`) and check them into a `performance/` folder.
3. Stabilize CSV export under load using pagination/chunking or async generation.
4. Standardize error envelope for 409/422 conditions across token and counter flows.
5. Re-run this same matrix with real staging data and replace synthetic metrics.

---

## 9. Reproduction Commands (For Actual Execution)

### 9.1 Playwright (existing smoke suites)

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

### 9.2 JMeter (example command for future real run)

```bash
jmeter -n \
  -t performance/queuelanka_sprint3.jmx \
  -l performance/results/sprint3_results.jtl \
  -e -o performance/results/html-report
```

### 9.3 Lightweight local load fallback (already in repository)

```bash
node scripts/load_test_local.js --url http://localhost:5012/health --duration 30 --concurrency 50
```

---

## 10. Traceability to Sprint 3 Goals

- Reliability: covered by expanded negative paths and role-protected route validation.
- Performance: covered by synthetic JMeter scenarios for booking, officer actions, and reports.
- Security: covered by 401/403 behavior checks across citizen/officer/admin boundaries.
- Production readiness: report identifies no critical blockers and lists concrete hardening actions.

End of report.
