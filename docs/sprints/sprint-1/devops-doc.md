# DevOps Documentation (Current Implementation)

Project: Qlanka-pro  
Date: April 6, 2026

This document is based on the current repository implementation, workflow files, and scripts.

For full day-to-day engineering guidance (local development, coding workflow, tests, and troubleshooting), see: [developer-doc.md](developer-doc.md).

---

## 1. Repository Delivery Model

Qlanka-pro is delivered as:

- Backend microservices (.NET 8):
  - QueueLanka.Gateway
  - QueueLanka.Identity
  - QueueLanka.ServiceCenter
  - QueueLanka.Queue
  - QueueLanka.Notification
- Frontend:
  - React + Vite + TypeScript
- Shared solution:
  - Qlanka-pro.sln
- CI/CD and governance via GitHub Actions in .github/workflows

---

## 2. Runtime and Tooling Baseline

Required baseline used by workflows:

- .NET SDK: 8.0.x
- Node.js: 20 / 20.19.0
- Docker + Docker Compose (for containerized local/dev runs)
- MySQL 8.0 (for migration validation and runtime databases)

---

## 3. Branch and Trigger Behavior

Current workflow triggers are primarily configured for:

- main
- feature/microservices
- pull_request (varies by workflow path filters)
- workflow_dispatch (manual execution)

Implication:

- CI and deployment behavior depends on branch and changed paths.
- Some checks are always PR-based, while others are path-filtered and run only when relevant files change.

---

## 4. CI Pipeline Stages (Current)

CI is split into multiple workflows rather than one monolithic pipeline.

### 4.1 PR Quality Gate

Workflow: .github/workflows/pr-quality-gate.yml

Stage checks:

1. Checkout
2. Setup .NET
3. Restore + build backend solution
4. Run backend tests for all backend/*Tests.csproj
5. Setup Node.js
6. Install frontend dependencies
7. Lint frontend
8. Test frontend

Purpose:

- Fast consolidated PR gate for backend and frontend quality.

### 4.2 Backend Build/Test + Coverage Report Generation

Workflow: .github/workflows/dotnet-build.yml

Stage checks:

1. Checkout
2. Setup .NET
3. dotnet restore + dotnet build
4. Run backend tests with XPlat Code Coverage
5. Generate coverage report with ReportGenerator
6. Upload test and coverage artifacts

Produced artifacts:

- test-results
- backend-coverage-raw
- backend-coverage-report

### 4.3 Backend Coverage Gate

Workflow: .github/workflows/backend-coverage-gate.yml

Stage checks:

1. Run backend tests with coverage using backend/coverage.runsettings
2. Build consolidated report
3. Parse Summary.txt
4. Enforce line coverage threshold

Current gate value:

- MIN_LINE = 70

Current enforcement:

- Line coverage blocks pass/fail
- Branch coverage is reported in logs but not used as a fail condition

Artifact:

- backend-coverage-gate-report

### 4.4 Frontend Coverage Gate

Workflow: .github/workflows/frontend-ci.yml

Stage checks:

1. Checkout
2. Setup Node
3. npm ci
4. npm run test:coverage
5. Upload frontend coverage artifact

Threshold source:

- frontend/vite.config.ts

Current thresholds:

- lines: 70
- functions: 70
- branches: 69
- statements: 70

Artifact:

- frontend-coverage-report

### 4.5 Frontend Coverage Report Workflow

Workflow: .github/workflows/frontend-coverage.yml

Purpose:

- Generates and uploads coverage report; useful for explicit report generation and verification.

Artifact:

- frontend-coverage-report

### 4.6 Docs Validation

Workflow: .github/workflows/docs-validation.yml

Stage checks:

1. markdownlint over markdown files
2. lychee link checks

Purpose:

- Prevent broken docs formatting/links from merging.

### 4.7 Migration Validation

Workflow: .github/workflows/migration-validation.yml

Stage checks:

1. Start MySQL service in CI
2. Wait for DB health
3. Apply Identity migrations
4. Apply Queue migrations
5. Apply ServiceCenter migrations

Purpose:

- Catch migration script failures before merge/deploy.

### 4.8 Security, Dependency, and Compliance Gates

Dependency audit:

- Workflow: .github/workflows/dependency-audit.yml
- npm audit at critical level
- NuGet vulnerability scan; fails on High/Critical
- Artifact: nuget-audit-reports

License compliance:

- Workflow: .github/workflows/license-compliance.yml
- npm + NuGet license report checks
- Artifact: license-reports

Container image scan:

- Workflow: .github/workflows/docker-image-scan.yml
- Trivy scan for HIGH/CRITICAL
- exit-code 1 on violations

Static analysis:

- Workflow: .github/workflows/codeql-analysis.yml
- csharp + javascript-typescript analysis matrix

---

## 5. Deployment Pipelines (Current)

### 5.1 Microservices Deploy

Workflow: .github/workflows/deploy-microservices.yml

Flow:

1. Matrix build for gateway, identity, servicecenter, queue, notification
2. ACR login
3. Azure login (service principal JSON or OIDC)
4. Build and push image tags:
   - <acr>/<service>:<sha>
   - <acr>/<service>:latest
5. Update Azure Container App image
6. Apply autoscaling parameters per service
7. Set revision traffic split using rollout_percent input

Important deployment controls:

- rollout_percent input (1-100)
- min/max replicas and HTTP concurrency per service
- container app revision traffic routing

### 5.2 Frontend Deploy

Workflow: .github/workflows/deploy-frontend.yml

Flow:

1. Checkout
2. Setup Node
3. npm ci
4. npm run build with VITE_API_BASE_URL from workflow env
5. npm prune --production
6. Deploy to Azure App Service
7. Verify deployed frontend URL by repeated HTTP checks

Current env values in workflow:

- AZURE_API_BASE_URL: https://20.193.250.12:9443
- AZURE_FRONTEND_URL: https://queuelanka-frontend-hrcvdec5dnach0aj.centralindia-01.azurewebsites.net

---

## 6. How Failures Block Deployment

### 6.1 Within a single workflow

- Any failing step exits non-zero and fails the job.
- Failed deployment job stops rollout in that run.

### 6.2 Across CI and deploy workflows

Current implementation uses separate workflows (CI checks and deployment workflows are separate files).

Practical blocking model:

1. Failed CI checks block PR readiness.
2. If repository branch protection requires those checks, merge is blocked.
3. When merge is blocked, protected-branch push-based deployments are indirectly blocked.

Note:

- There is no explicit cross-workflow needs chain that forces deploy workflows to wait for CI workflow completion in YAML.
- Governance relies on branch protection and process discipline.

---

## 7. Logs and Artifact Access

### 7.1 Job Logs

How to access:

1. Open GitHub repository -> Actions.
2. Select workflow run.
3. Open failed job.
4. Expand failed step logs.

High-value steps to inspect first:

- Run backend tests
- Enforce thresholds
- Run frontend coverage
- Apply * migrations
- Audit NuGet dependencies
- Trivy scan
- Perform CodeQL Analysis
- Verify frontend deployment

### 7.2 Artifacts

From workflow run summary -> Artifacts section, download as needed.

Common artifacts:

- test-results
- backend-coverage-raw
- backend-coverage-report
- backend-coverage-gate-report
- frontend-coverage-report
- nuget-audit-reports
- license-reports
- frontend-preview-pr-<number>

Use cases:

- Validate detailed coverage reports beyond log summary
- Analyze dependency/license JSON outputs
- Inspect generated frontend preview build output

---

## 8. Local Operational Commands

From repository root unless noted.

Backend build and tests:

```bash
dotnet restore Qlanka-pro.sln
dotnet build Qlanka-pro.sln --configuration Release --no-restore
```

Run backend tests across test projects:

```bash
# Linux/macOS shell style
for p in $(find backend -name "*.Tests.csproj" | sort); do
  dotnet test "$p" --configuration Release --no-build
 done
```

Frontend quality checks:

```bash
cd frontend
npm ci
npm run lint
npm run test
npm run test:coverage
```

Local observability stack (Windows PowerShell):

```powershell
./scripts/start-local-observability-stack.ps1 -PrometheusExe C:\tools\prometheus\prometheus.exe
./scripts/stop-local-observability-stack.ps1
```

Docker local stack:

```bash
docker compose up -d
docker compose down
```

---

## 9. Release and Post-Deploy Validation

Release workflow:

- .github/workflows/release.yml
- Triggered by tags matching v*
- Builds backend and frontend
- Packs release archive
- Creates GitHub release

Post-deploy smoke workflow:

- .github/workflows/api-smoke.yml
- Manual trigger with base_url input
- Executes QueueLanka.SmokeTests

Recommended production-safe sequence:

1. Ensure CI and quality gates are green.
2. Run deployment workflow.
3. Run post-deploy smoke workflow.
4. Confirm service health, coverage trends, and observability dashboards.

---

## 10. DevOps Maintenance Checklist

When changing CI/CD behavior:

1. Update workflow YAML in .github/workflows.
2. Keep fail conditions explicit (non-zero exit on gate fail).
3. Keep artifacts enabled for diagnostics (prefer if: always() where useful).
4. Re-check path/branch filters to avoid missed validations.
5. Re-run impacted workflows via workflow_dispatch before merge.
6. Document threshold, scan severity, and rollout changes in the same PR.

This document should be updated whenever a workflow stage, quality gate threshold, or deployment path changes.
