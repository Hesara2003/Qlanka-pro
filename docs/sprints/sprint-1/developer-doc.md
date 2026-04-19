# Sprint 1 - Full Developer Documentation

Project: Qlanka-pro  
Date: April 6, 2026

This document provides a complete developer guide for local development, coding workflow, testing, and troubleshooting.

---

## 1. Tech Stack and Architecture

### Backend

- .NET 8 microservices
- API Gateway: QueueLanka.Gateway
- Services: QueueLanka.Identity, QueueLanka.ServiceCenter, QueueLanka.Queue, QueueLanka.Notification
- Shared library: QueueLanka.Shared
- Unit/integration tests with xUnit

### Frontend

- React 19 + TypeScript + Vite
- Routing and dashboard flows by role (citizen/officer/admin)
- Realtime queue synchronization via SignalR client

### Data and Runtime

- MySQL 8 (service-specific databases)
- Docker Compose orchestration for full local stack
- Prometheus + Grafana for observability

---

## 2. Repository Map

- backend/QueueLanka.Gateway
- backend/QueueLanka.Identity
- backend/QueueLanka.ServiceCenter
- backend/QueueLanka.Queue
- backend/QueueLanka.Notification
- backend/QueueLanka.Shared
- backend/QueueLanka.API.Tests
- backend/QueueLanka.Identity.Tests
- backend/QueueLanka.ServiceCenter.Tests
- backend/QueueLanka.Queue.Tests
- frontend/
- QueueLanka.SmokeTests/
- scripts/
- docs/

---

## 3. Prerequisites

Install the following before starting development:

- .NET SDK 8.0.x
- Node.js 20.19.0 or later
- npm 10+
- Docker Desktop (with Compose)
- Git

Recommended:

- VS Code with C# Dev Kit, ESLint, Playwright, and Docker extensions

---

## 4. Local Run Options

You can run the project in two modes.

### Option A: Full stack with Docker Compose

From repository root:

```bash
docker compose up -d --build
```

Services exposed by compose:

- Gateway: http://localhost:5000
- Identity: http://localhost:5001
- Service Center: http://localhost:5002
- Queue: http://localhost:5003
- Notification: http://localhost:5004
- Frontend: http://localhost:3000
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001

Stop stack:

```bash
docker compose down
```

### Option B: Service-by-service local debugging

Run backend services individually with dotnet run.

Common HTTP ports from launch profiles:

- Gateway: http://localhost:5012
- Identity: http://localhost:5177
- Service Center: http://localhost:5137
- Queue: http://localhost:5239

Frontend dev server:

```bash
cd frontend
npm ci
npm run dev
```

---

## 5. Build and Test Commands

### Backend restore/build

```bash
dotnet restore Qlanka-pro.sln
dotnet build Qlanka-pro.sln --configuration Release --no-restore
```

### Backend tests

```bash
dotnet test backend/QueueLanka.API.Tests/QueueLanka.API.Tests.csproj --configuration Release
dotnet test backend/QueueLanka.Identity.Tests/QueueLanka.Identity.Tests.csproj --configuration Release
dotnet test backend/QueueLanka.ServiceCenter.Tests/QueueLanka.ServiceCenter.Tests.csproj --configuration Release
dotnet test backend/QueueLanka.Queue.Tests/QueueLanka.Queue.Tests.csproj --configuration Release
```

### Frontend quality checks

```bash
cd frontend
npm ci
npm run lint
npm run test
npm run test:coverage
npm run build
```

### Smoke tests (Playwright)

```bash
cd QueueLanka.SmokeTests
npm ci
npm run test
```

---

## 6. Environment and Configuration

### Frontend

The frontend build/deploy relies on an API base URL.

- Typical variable: VITE_API_BASE_URL (used in CI deployment build)

When running locally, keep frontend target aligned with the gateway base URL in use.

### Backend

Service configuration is sourced from appsettings and environment variables.

Important keys used by services:

- ASPNETCORE_ENVIRONMENT
- ConnectionStrings__DefaultConnection
- Jwt__Secret
- Jwt__Issuer
- Jwt__Audience
- ServiceUrls__ServiceCenter (Queue -> ServiceCenter communication)

For compose, secrets are mounted from:

- secrets/db_password.txt
- secrets/jwt_secret.txt

---

## 7. Database and Migrations

MySQL is used with service-specific databases:

- identity_db
- servicecenters_db
- queue_db

Migration validation is part of CI via migration-validation workflow.

Developer guidance:

1. Keep EF migrations scoped to the owning service.
2. Validate new migrations locally against MySQL before PR.
3. Do not merge schema updates without corresponding test updates.

---

## 8. CI/CD Alignment for Developers

Primary workflows affecting day-to-day development:

- pr-quality-gate.yml
- dotnet-build.yml
- backend-coverage-gate.yml
- frontend-ci.yml
- docs-validation.yml
- migration-validation.yml
- dependency-audit.yml
- docker-image-scan.yml

Before opening a PR, run the closest local equivalent:

1. Backend build and tests
2. Frontend lint, tests, coverage, build
3. Docs link/format sanity for modified markdown
4. Migration verification if schema changed

---

## 9. Coding and PR Workflow

Branch model used in project docs:

- Base integration branch: develop
- Feature branches: feature/<area>-<description>
- Hotfix branches: hotfix/<bug-name>

Recommended PR checklist:

1. Keep PR scope focused to one story/task.
2. Include tests for behavior changes.
3. Ensure no secrets in code, scripts, or logs.
4. Update docs for API/behavior/config changes.
5. Confirm all required checks are green.

Commit style recommendation:

- feat(scope): add counter reassignment validation
- fix(scope): handle null token response
- docs(scope): update sprint-1 developer guide
- test(scope): add queue service unit tests

---

## 10. Debugging and Troubleshooting

### Service does not start

- Check port conflict on launch profile port.
- Confirm .NET 8 SDK is active.
- Inspect appsettings and required environment variables.

### Frontend cannot call API

- Verify frontend API base URL points to gateway.
- Check gateway/service CORS policies and auth headers.
- Confirm gateway and target microservice are both running.

### Database connection errors

- Ensure MySQL container/service is healthy.
- Verify connection string host, port, db, and credentials.
- Check secret files are present for compose runs.

### Realtime queue updates missing

- Confirm queue service is running.
- Verify SignalR endpoint path and token handling.
- Check browser console and backend logs for hub/auth errors.

---

## 11. Observability and Operational Checks

Local observability scripts (PowerShell):

```powershell
./scripts/start-local-observability-stack.ps1 -PrometheusExe C:\tools\prometheus\prometheus.exe
./scripts/stop-local-observability-stack.ps1
```

During issue triage, validate:

1. Service health endpoints
2. Error rates and latency in Grafana
3. Container logs for gateway and failing service
4. CI artifacts for failing coverage/test/security steps

---

## 12. Definition of Done (Developer Perspective)

A story is considered dev-complete when:

1. Functional requirements and acceptance criteria are implemented.
2. Automated tests are added/updated and passing.
3. Coverage remains above configured thresholds.
4. Docs are updated (API, user, technical, or sprint docs as relevant).
5. No high/critical security or dependency issues are introduced.

---

## 13. Related Documentation

- Sprint DevOps guide: devops-doc.md
- Sprint API reference: api-documentation.md
- Sprint technical decisions: technical-decisions-log.md
- Per-ticket implementation docs: development-docs/
- Project-wide docs index: ../../README.md
