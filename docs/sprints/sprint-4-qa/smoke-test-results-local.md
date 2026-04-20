# Local Smoke Test Results (Simulated Staging)

## Scope
Smoke validation was simulated locally using focused automated tests for critical user paths.

## Executed Commands
- Frontend smoke slice:
  - `npx vitest run src/pages/DashboardPage.test.tsx src/components/serviceCenter/ServiceCenterCard.test.tsx src/api/authApi.test.ts src/api/reportsApi.test.ts --pool=threads --maxWorkers=1`
- Backend smoke/security/perf slice:
  - `dotnet test backend/QueueLanka.API.Tests/QueueLanka.API.Tests.csproj --filter "FullyQualifiedName~CounterAuthorizationTests|FullyQualifiedName~ReportsAuthorizationTests|FullyQualifiedName~QueueApiConsistencyAndPerformanceTests"`

## Checklist

| Smoke Item | Validation Method | Result |
|---|---|---|
| App shell/dashboard renders | `DashboardPage.test.tsx` | Pass |
| Login/auth API behavior | `authApi.test.ts` + backend authz tests | Pass |
| Dashboard data/refresh works | `DashboardPage.test.tsx` | Pass |
| Reports flow loads and validates | backend report auth+consistency tests | Pass |
| Export trigger and CSV shape | `ServiceCenterCard.test.tsx` + `reportsApi.test.ts` + backend CSV tests | Pass |

## Outcome
- Frontend smoke slice: 18/18 tests passed.
- Backend smoke/security/perf slice: 17/17 tests passed.
- No local smoke blockers identified.
