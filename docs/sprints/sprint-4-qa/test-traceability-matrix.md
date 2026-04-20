# Sprint 4 Test Case and Report Linkage

## Feature to Test Mapping

| Feature Area | Frontend Tests | Backend Tests | Documentation Links |
|---|---|---|---|
| Dashboard functionality | `frontend/src/pages/DashboardPage.test.tsx`, `frontend/src/pages/AdminDashboardPage.test.tsx` | `backend/QueueLanka.API.Tests/CounterDashboardServiceTests.cs` | `docs/sprints/sprint-4-qa/uat-test-pack.md` |
| Report builder and export | `frontend/src/components/serviceCenter/ServiceCenterCard.test.tsx`, `frontend/src/api/reportsApi.test.ts` | `backend/QueueLanka.API.Tests/ReportServiceTests.cs`, `backend/QueueLanka.API.Tests/ReportCsvValidationTests.cs`, `backend/QueueLanka.API.Tests/ReportRepositoryIntegrationTests.cs` | `docs/sprints/sprint-4-qa/uat-test-pack.md` |
| Data consistency (dashboard vs reports) | N/A (integration validated backend side) | `backend/QueueLanka.API.Tests/QueueApiConsistencyAndPerformanceTests.cs` | `docs/sprints/sprint-4-qa/performance-comparison.md` |
| RBAC and auth hardening | API client auth tests (`frontend/src/api/authApi.test.ts`) | `backend/QueueLanka.API.Tests/CounterAuthorizationTests.cs`, `backend/QueueLanka.API.Tests/ReportsAuthorizationTests.cs` | `docs/sprints/sprint-4-qa/owasp-checklist.md` |
| Security headers and safe errors | N/A | `backend/QueueLanka.API.Tests/QueueApiConsistencyAndPerformanceTests.cs`, `backend/QueueLanka.API.Tests/ReportsAuthorizationTests.cs` | `docs/sprints/sprint-4-qa/owasp-checklist.md` |
| Smoke regression | Focused frontend smoke command | Focused backend smoke command | `docs/sprints/sprint-4-qa/smoke-test-results-local.md` |

## Coverage Overview (Local)
- Frontend coverage (V8): 82.35% statements, 72.41% branches, 100% functions, 85.29% lines.
- Backend API test suite: 165/165 passed in full run.
- Focused smoke/security/performance backend run: 17/17 passed.

## Report Index
- Analysis: `docs/sprints/sprint-4-qa/project-analysis.md`
- OWASP: `docs/sprints/sprint-4-qa/owasp-checklist.md`
- Performance: `docs/sprints/sprint-4-qa/performance-comparison.md`
- Smoke: `docs/sprints/sprint-4-qa/smoke-test-results-local.md`
- UAT pack: `docs/sprints/sprint-4-qa/uat-test-pack.md`
- UAT results: `docs/sprints/sprint-4-qa/uat-results-tracking.md`
