# Sprint 4 UAT Test Pack

| Trace ID | Feature | Scenario | Steps | Expected Result |
|---|---|---|---|---|
| UAT-S4-001 | Dashboard | User opens dashboard with active tokens | 1. Login as citizen 2. Open dashboard 3. Observe active queue cards | Active token cards render with center, status, queue position/ETA |
| UAT-S4-002 | Dashboard | User opens dashboard with no tokens | 1. Login as citizen with no bookings 2. Open dashboard | Empty state appears with action to find a service center |
| UAT-S4-003 | Dashboard | Manual refresh updates dashboard | 1. Open dashboard 2. Click Refresh | Refresh action triggers data reload without crash |
| UAT-S4-004 | Report Export | Admin exports center summary CSV | 1. Login as admin 2. Select date range 3. Click Download CSV | CSV export is triggered and file metadata is valid |
| UAT-S4-005 | Report Export | Report error handling | 1. Trigger report API error (invalid range/server error) 2. Attempt export | User sees a safe actionable error message |
| UAT-S4-006 | Data Consistency | Dashboard/report metric parity | 1. Query `/api/counters/{id}/stats` 2. Query report CSV 3. Compare served/skipped | Values match exactly |
| UAT-S4-007 | Security/RBAC | Unauthorized user access blocked | 1. Call protected API without token 2. Retry with wrong role | 401/403 returned as appropriate |
| UAT-S4-008 | Security Headers | API responses include hardening headers | 1. Call stats endpoint 2. Inspect response headers | CSP, X-Content-Type-Options, X-Frame-Options present |
| UAT-S4-009 | Validation | Invalid report filters rejected safely | 1. Call report endpoint with malformed centerIds | 400 response with safe message/no stack trace |
| UAT-S4-010 | Performance | Local response-time check | 1. Run perf test suite 2. Review p95 assertions | p95 thresholds pass for stats and report APIs |
| UAT-S4-011 | Smoke | Critical flow simulation local | 1. Run focused frontend/backend smoke commands | All critical flows pass |
