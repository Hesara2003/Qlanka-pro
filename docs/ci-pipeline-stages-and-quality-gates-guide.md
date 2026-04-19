# CI Pipeline Stages and Quality Gates Guide

This guide documents the current CI stages, quality gates, deployment impact of failures, and how to access logs and artifacts in GitHub Actions.

## 1. CI Pipeline Map

The repository uses multiple GitHub Actions workflows under .github/workflows. Instead of one linear pipeline file, CI is implemented as stage-focused workflows.

Primary CI workflows:

- .github/workflows/pr-quality-gate.yml
- .github/workflows/dotnet-build.yml
- .github/workflows/backend-coverage-gate.yml
- .github/workflows/frontend-ci.yml
- .github/workflows/docs-validation.yml
- .github/workflows/migration-validation.yml
- .github/workflows/dependency-audit.yml
- .github/workflows/license-compliance.yml
- .github/workflows/docker-image-scan.yml
- .github/workflows/codeql-analysis.yml

Deployment-related workflows:

- .github/workflows/deploy-microservices.yml
- .github/workflows/deploy-frontend.yml

## 2. Stages and What They Validate

### Stage A: PR quality gate

Workflow: .github/workflows/pr-quality-gate.yml

Checks:

1. Backend restore and build.
2. Backend unit test execution across all backend/*Tests.csproj.
3. Frontend dependency install.
4. Frontend lint.
5. Frontend tests.

Purpose:

- Fast consolidated PR gate for backend and frontend correctness.

### Stage B: Backend build, tests, and report generation

Workflow: .github/workflows/dotnet-build.yml

Checks:

1. .NET restore/build for solution.
2. Backend tests with XPlat code coverage.
3. Coverage report generation (ReportGenerator).
4. Artifact upload for test and coverage outputs.

Purpose:

- Produces reusable backend test and coverage artifacts for inspection.

### Stage C: Backend coverage enforcement

Workflow: .github/workflows/backend-coverage-gate.yml

Checks:

1. Backend tests with coverage collection.
2. Coverage summary extraction from TestResults/CoverageReport/Summary.txt.
3. Threshold gate on line coverage via MIN_LINE.

Current threshold:

- MIN_LINE = 70

Notes:

- Branch coverage is logged but not currently enforced as a fail condition.

### Stage D: Frontend coverage enforcement

Workflow: .github/workflows/frontend-ci.yml

Checks:

1. Frontend install.
2. npm run test:coverage.
3. Thresholds are enforced by Vitest config in frontend/vite.config.ts.

Current thresholds in frontend/vite.config.ts:

- lines: 70
- functions: 70
- branches: 69
- statements: 70

### Stage E: Documentation quality

Workflow: .github/workflows/docs-validation.yml

Checks:

1. Markdown lint across docs and markdown files.
2. Link validation with lychee.

### Stage F: Migration validation

Workflow: .github/workflows/migration-validation.yml

Checks:

1. Spins up MySQL service in CI.
2. Applies SQL migrations for identity, queue, and service-center databases.
3. Fails if migrations cannot be applied cleanly.

### Stage G: Dependency and license/security governance

Workflows:

- dependency-audit.yml: npm audit (critical) and NuGet vulnerability checks (High/Critical fail).
- license-compliance.yml: npm and NuGet license checks with uploaded reports.
- docker-image-scan.yml: Trivy image scan, fails on HIGH/CRITICAL findings.
- codeql-analysis.yml: static analysis for csharp and javascript-typescript.

## 3. Quality Gates Summary

The current quality gates are:

1. Build and test gates
   - Backend build/test must pass.
   - Frontend lint/test must pass.
2. Coverage gates
   - Backend line coverage must be >= 70.
   - Frontend coverage thresholds must satisfy Vitest limits.
3. Docs quality gate
   - Markdown and link validation must pass for docs changes.
4. Database safety gate
   - SQL migrations must apply in CI database service.
5. Security/compliance gates
   - Dependency, license, image scan, and CodeQL checks must pass when triggered.

## 4. How Failures Block Deployment

Failure impact depends on where the failure occurs and how deployment is triggered.

### 4.1 Pull request flow

- Failed CI checks prevent a healthy PR status.
- If branch protection requires these checks, merge is blocked.
- Since production-oriented deployments are tied to pushes/tags, blocked merge also blocks downstream deployment from protected branches.

### 4.2 Deployment workflow flow

Workflows:

- .github/workflows/deploy-microservices.yml
- .github/workflows/deploy-frontend.yml

Behavior:

- A failing step inside a deployment workflow stops that job/workflow and deployment does not complete.
- These deployment workflows are triggered by push/workflow_dispatch and do not declare needs dependencies on CI workflows.

Implication:

- Deployment blocking is guaranteed inside the deployment workflow itself.
- Cross-workflow blocking from CI to deployment relies on branch governance (required checks and merge policy), not on explicit needs links between workflow files.

## 5. Accessing Logs in GitHub Actions

1. Open repository Actions tab.
2. Select the relevant workflow run.
3. Open the failed or relevant job.
4. Expand the failed step to inspect full logs.
5. Use the search box in logs for key terms like error, failed, exception, vulnerability, threshold.

Recommended first log to inspect by workflow type:

- pr-quality-gate: Run backend tests, Lint frontend, Test frontend
- dotnet-build: Run tests, Generate backend coverage report
- backend-coverage-gate: Enforce thresholds
- frontend-ci: Run frontend coverage
- migration-validation: Apply * migrations
- dependency-audit: Audit frontend/npm, Audit NuGet dependencies
- docker-image-scan: Trivy scan
- codeql-analysis: Perform CodeQL Analysis

## 6. Accessing Artifacts

Artifacts are attached to workflow runs and can be downloaded from the run summary page.

Artifact names currently used:

- dotnet-build.yml
  - test-results
  - backend-coverage-raw
  - backend-coverage-report
- backend-coverage-gate.yml
  - backend-coverage-gate-report
- frontend-ci.yml / frontend-coverage.yml
  - frontend-coverage-report
- dependency-audit.yml
  - nuget-audit-reports
- license-compliance.yml
  - license-reports
- preview-environment.yml
  - frontend-preview-pr-<number>

Tip:

- Use artifacts to inspect generated reports when logs only show pass/fail summaries.

## 7. Operational Instructions for Teams

When adding or updating pipeline stages:

1. Keep trigger paths narrow to avoid unnecessary runs.
2. Keep fail conditions explicit in scripts (non-zero exit on gate violation).
3. Upload artifacts with if: always() for post-failure diagnostics where useful.
4. Document any new gate threshold and rationale in the same pull request.
5. If deployment must hard-depend on CI outcomes across workflows, introduce an explicit gating strategy (for example required checks policy or workflow dependency orchestration).

## 8. Quick Reference

- CI checks: Actions tab, workflow runs by name.
- Gate thresholds:
  - Backend: .github/workflows/backend-coverage-gate.yml (MIN_LINE)
  - Frontend: frontend/vite.config.ts (coverage thresholds)
- Deployment workflows:
  - .github/workflows/deploy-microservices.yml
  - .github/workflows/deploy-frontend.yml
