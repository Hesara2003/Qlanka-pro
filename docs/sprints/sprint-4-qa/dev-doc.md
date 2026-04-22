# Sprint 4 Development Document

Project: QueueLanka Pro  
Sprint: Sprint 4 (8 Apr - 22 Apr 2026)  
Audience: Engineering Team, QA, Sprint Review Stakeholders

## 1. Sprint 4 Scope Summary

Sprint 4 focused on final product readiness for release/demo with emphasis on:
- Advanced dynamic reporting (ad-hoc reports, CSV/PDF export, pagination/streaming support).
- Admin analytics dashboard backed by reporting endpoints.
- Security hardening and RBAC verification.
- QA/UAT consolidation and traceability.
- Final performance stabilization and DB index tuning.
- Deployment/release readiness.

## 2. Completed Engineering Work

### 2.1 Reporting and Export Features

Implemented backend endpoint and export capabilities:
- Endpoint: `GET /api/reports/custom`
- Supported outputs:
  - `format=json` (default)
  - `format=csv`
  - `format=pdf`
- Grouping: `date`, `center`, `date_center`
- Metrics: `total_tokens_issued`, `total_served`, `total_skipped`, `total_cancelled`, `no_show_count`, `avg_wait_time_seconds`, `avg_service_time_seconds`, `active_counters`
- Filters: date range, center ids, statuses
- Pagination: `page`, `pageSize` with bounded validation
- Large export handling:
  - CSV export supports paged retrieval/streaming patterns for high row-count datasets.

Core implementation references:
- [Custom reports controller](backend/QueueLanka.Queue/Controllers/ReportsController.cs)
- [Report service validation and orchestration](backend/QueueLanka.Queue/Services/ReportService.cs)
- [Dynamic aggregate query implementation](backend/QueueLanka.Queue/Data/ReportRepository.cs)
- [Custom report DTOs](backend/QueueLanka.Queue/DTOs/Reports/CustomReportQueryDto.cs)

### 2.2 Admin Analytics Dashboard

Admin analytics dashboard implemented using reporting endpoints as source-of-truth.

Delivered visuals/cards:
- Daily bookings trend
- Served vs skipped
- Average wait time
- Peak hours

Filter behavior:
- Date range filter
- Center filter
- Filter changes trigger endpoint refresh and chart/card recalculation.

Frontend references:
- [Admin analytics page](frontend/src/pages/AdminDashboardPage.tsx)
- [Reports API client](frontend/src/api/reportsApi.ts)
- [Analytics page tests](frontend/src/pages/AdminDashboardPage.test.tsx)

### 2.3 Test and Quality Validation

Evidence consolidated in Sprint 4 QA docs folder.

Key outcomes:
- Backend and frontend tests passing for modified reporting/dashboard components.
- Export parity tests verify JSON preview alignment with CSV/PDF content.
- RBAC and error-path coverage included for report endpoints.

References:
- [All integrated test results](docs/sprints/sprint-4-qa/all-test-results.md)
- [Traceability matrix](docs/sprints/sprint-4-qa/test-traceability-matrix.md)
- [Local execution commands](docs/sprints/sprint-4-qa/local-execution-commands.md)

## 3. Database Index Analysis and Tuning

### 3.1 Query Hotspots Reviewed

Query analysis targeted:
- Date-range + center grouped report queries on `tokens`
- Status-filtered report queries on `tokens`
- Peak-hour subqueries grouped by hour/date/center
- Queue position shifts for cancel/reassign paths

Primary query sources:
- [Report query code](backend/QueueLanka.Queue/Data/ReportRepository.cs)
- [Queue service schema and procedures](backend/QueueLanka.Queue/Database/Migrations/001_queue_schema.sql)

### 3.2 Existing Helpful Indexes

Already present in queue schema:
- `idx_token_issued_date (center_id, issued_date)`
- `idx_token_status (status)`
- `idx_token_status_position (center_id, status, queue_position)`
- `idx_token_queue_shift (center_id, issued_date, status, queue_position)`
- `idx_token_cancelled_at (center_id, issued_date, cancelled_at)`

### 3.3 Sprint 4 Index Tuning Additions

Recommended/added tuning for reporting-heavy workloads:

```sql
-- Optimizes custom report filtering by date + status + center
CREATE INDEX idx_token_report_date_status_center
  ON tokens (issued_date, status, center_id);

-- Optimizes peak-hour aggregation by date + center + issued_time
CREATE INDEX idx_token_report_peak_hour
  ON tokens (issued_date, center_id, issued_time);

-- Optimizes average wait/service calculations by called/served timestamps
CREATE INDEX idx_token_report_timing
  ON tokens (issued_date, center_id, called_at, served_at);
```

### 3.4 Verification Method

Use EXPLAIN on representative report queries and compare before/after:

```sql
EXPLAIN FORMAT=TRADITIONAL
SELECT DATE(t.issued_at), t.center_id, COUNT(*)
FROM tokens t
WHERE DATE(t.issued_at) BETWEEN '2026-03-01' AND '2026-03-30'
  AND t.status IN ('Served', 'Completed', 'Skipped')
  AND t.center_id IN (11,12)
GROUP BY DATE(t.issued_at), t.center_id;
```

Success criteria for tuning:
- Lower scanned rows and reduced temporary table usage where possible.
- Stable p95 for report endpoints under 30-day ranges.

## 4. Performance and Reliability Notes

- Custom reports use strict request validation and capped page sizes.
- CSV/PDF generation paths handle no-data and invalid format scenarios safely.
- Analytics dashboard avoids redundant heavy calls and recalculates only on filter changes.

References:
- [Performance comparison](docs/sprints/sprint-4-qa/performance-comparison.md)
- [Smoke test outcomes](docs/sprints/sprint-4-qa/smoke-test-results-local.md)

## 5. Release-Readiness Checklist (Engineering)

- Report API and export feature set: Complete.
- Admin analytics dashboard: Complete.
- Export/report parity tests: Complete.
- Security/RBAC checks for report routes: Complete.
- Index tuning and verification script set: Complete.
- Documentation and QA evidence bundle: Complete.

## 6. Sprint 4 Deliverables Index

- [Sprint 4 QA README](docs/sprints/sprint-4-qa/README.md)
- [Sprint 4 DevOps document](docs/sprints/sprint-4-qa/devops-doc.md)
- [Release notes (Sprint 4)](docs/sprints/sprint-4-qa/release-notes-sprint-4.md)
