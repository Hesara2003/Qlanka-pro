# QueueLanka Pro — Sprint 4 Release Notes

Release Candidate: Sprint 4 Final  
Planned Tag: `v1.0-final` (alternative: `sprint-4-demo`)  
Release Date: April 2026

## 1. Highlights

- Introduced advanced dynamic reporting with ad-hoc metrics and filters.
- Added CSV and PDF export support for custom reports.
- Added pagination/streaming strategies for large report exports.
- Delivered admin analytics dashboard backed by reporting endpoints.
- Expanded RBAC and report authorization test coverage.
- Consolidated Sprint 4 QA, UAT, and traceability artifacts.

## 2. Key Features Delivered

### Reporting
- `GET /api/reports/custom` supports:
  - Grouping (`date`, `center`, `date_center`)
  - Metric selection
  - Date/center/status filters
  - Pagination controls
  - JSON/CSV/PDF outputs

### Analytics Dashboard
- Cards/Charts:
  - Daily bookings
  - Served vs skipped
  - Average wait time
  - Peak hours
- Filters:
  - Date range
  - Center
- Chart values sourced from reporting APIs for parity.

### Performance and Data Handling
- Large-report export handling improved with pagination/streaming patterns.
- Report endpoint validation hardened for safe bounded queries.

## 3. Quality and Test Status

- Backend solution test pass confirmed in local execution.
- Targeted report authorization suite pass confirmed.
- Frontend analytics and reports API tests passing.

Evidence:
- [All test results](docs/sprints/sprint-4-qa/all-test-results.md)
- [Smoke test results](docs/sprints/sprint-4-qa/smoke-test-results-local.md)
- [Traceability matrix](docs/sprints/sprint-4-qa/test-traceability-matrix.md)

## 4. Database Index Tuning Summary

To support report-heavy and queue-heavy workloads, index tuning runbook includes:

```sql
CREATE INDEX idx_token_report_date_status_center ON tokens (issued_date, status, center_id);
CREATE INDEX idx_token_report_peak_hour ON tokens (issued_date, center_id, issued_time);
CREATE INDEX idx_token_report_timing ON tokens (issued_date, center_id, called_at, served_at);
```

Validation method:
- Compare EXPLAIN plans and endpoint p95 before/after index rollout.

## 5. Deployment and Release Actions

1. Build and deploy backend containers to Azure Container Apps.
2. Deploy frontend to Azure App Service.
3. Verify gateway and report endpoints.
4. Execute smoke tests.
5. Create and push git tag.

Tag commands:

```powershell
git tag -a v1.0-final -m "Sprint 4 final release build"
git push origin v1.0-final
```

## 6. Known Issues / Risks

- Local deployment hosts without Docker must use `az acr build`.
- Free/low-tier cloud environments can introduce cold-start latency.

## 7. Release Readiness Statement

Sprint 4 codebase and documentation are prepared for final deployment and sprint review demonstration, subject to final staging rollout execution and tag publication.
