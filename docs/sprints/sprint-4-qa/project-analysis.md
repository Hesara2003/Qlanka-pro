# Sprint 4 Project Analysis (Local)

## Frontend test setup
- Test runner: Vitest (`frontend/package.json` scripts `test`, `test:coverage`).
- UI test library: React Testing Library + jest-dom (`@testing-library/react`, `@testing-library/jest-dom`).
- Environment: jsdom (`frontend/vite.config.ts`).
- Stability mode for local Windows: Vitest `threads` pool with `singleThread: true` and `maxWorkers: 1`.

## Backend test setup
- Framework: xUnit + Moq + FluentAssertions (`backend/QueueLanka.API.Tests/QueueLanka.API.Tests.csproj`).
- Integration pattern: `WebApplicationFactory<TEntryPoint>` for local in-memory API host.
- Test coverage domains already present:
  - auth and RBAC (`CounterAuthorizationTests`, `ReportsAuthorizationTests`)
  - report repository and CSV generation (`ReportRepositoryIntegrationTests`, `ReportCsvValidationTests`)
  - queue/dashboard consistency + latency assertions (`QueueApiConsistencyAndPerformanceTests`)

## Report builder flow
- Frontend export action is in the admin `ServiceCenterCard` component.
- Date filters (`from`, `to`) are sent to `downloadDailyCenterSummaryCsv` (`frontend/src/api/reportsApi.ts`).
- Backend endpoint: `GET /api/reports/centers/{id}/summary` (`backend/QueueLanka.Queue/Controllers/ReportsController.cs`).
- Service generates CSV rows from repository aggregate query (`ReportService` + `ReportRepository`).

## Dashboard flow
- Citizen dashboard page: `frontend/src/pages/DashboardPage.tsx`.
- Data source: `useTokens` hook polling `/api/Token/my-tokens`.
- Real-time updates: `useQueueHub` (SignalR queue events).
- Officer dashboard counters/stats from `/api/counters/{counterId}/dashboard` and `/stats`.

## API structure
- Microservice-style backend projects under `backend/`.
- Gateway service routes requests and enforces auth/rate limiting.
- Queue service hosts report and counter endpoints.
- Shared middleware (`QueueLanka.Shared`) centralizes exception handling, request context, and security headers.

## Authentication and RBAC
- JWT bearer authentication in each API service.
- Role-based authorization policies and `[Authorize]` attributes.
- Tested paths validate 401 (missing/invalid token) and 403 (forbidden roles).

## Export functionality
- Implemented export format: CSV.
- Frontend receives blob response and triggers file download.
- Backend validates date ranges and center filters before generating CSV.

## Local run shape
- Frontend runs via Vite (`npm run dev` in `frontend`).
- Backend runs via `dotnet run` in each API project, or via Docker Compose for full stack simulation.
- All Sprint 4 test evidence below was generated from local execution only.
