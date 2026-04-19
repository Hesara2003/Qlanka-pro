# CI Code Coverage Gates Guide

This guide explains how code coverage gates are configured and maintained in CI for Qlanka-pro, and how to access coverage reports and update thresholds safely.

## Scope

The repository currently enforces coverage in these pipelines:

- Backend coverage gate: `.github/workflows/backend-coverage-gate.yml`
- Frontend coverage gate: `.github/workflows/frontend-ci.yml`

Related report workflows:

- Backend report generation in the CI pipeline: `.github/workflows/dotnet-build.yml`
- Frontend report workflow: `.github/workflows/frontend-coverage.yml`

## Coverage Gate Configuration in CI

### Backend Gate

Configuration source:

- Workflow: `.github/workflows/backend-coverage-gate.yml`
- Coverage collector settings: `backend/coverage.runsettings`

How it works:

1. Restores and builds the .NET solution.
2. Discovers all `*.Tests.csproj` projects under `backend/`.
3. Runs each test project with `XPlat Code Coverage` and `backend/coverage.runsettings`.
4. Generates a consolidated report using ReportGenerator.
5. Reads `TestResults/CoverageReport/Summary.txt`.
6. Enforces minimum line coverage via `MIN_LINE` (currently `70`).
7. Uploads the generated report as artifact `backend-coverage-gate-report`.

Current gate threshold:

- Line coverage minimum: `70%` (`MIN_LINE` environment variable in `backend-coverage-gate.yml`)

Important note:

- Backend gate currently fails only on line coverage. Branch coverage is extracted and logged, but not used as a fail condition.

### Frontend Gate

Configuration source:

- CI workflow: `.github/workflows/frontend-ci.yml`
- Coverage thresholds: `frontend/vite.config.ts`
- Coverage command: `frontend/package.json` script `test:coverage`

How it works:

1. Installs frontend dependencies in `frontend/`.
2. Runs `npm run test:coverage`.
3. Vitest enforces coverage thresholds from `frontend/vite.config.ts`.
4. Uploads `frontend/coverage` as artifact `frontend-coverage-report`.

Current frontend thresholds:

- Lines: `70`
- Functions: `70`
- Branches: `69`
- Statements: `70`

## Maintaining Coverage Gates

Use this checklist whenever coverage behavior must be reviewed or maintained.

1. Confirm gate files are still trigger-scoped correctly (backend-only and frontend-only path filters).
2. Validate tests and coverage generation locally before pushing:
   - Backend: run tests with coverage and check generated Cobertura files.
   - Frontend: run `npm run test:coverage` in `frontend/`.
3. Ensure artifact upload steps stay enabled with `if: always()` so reports are available even on failures.
4. Keep include/exclude patterns in `backend/coverage.runsettings` aligned with intended ownership boundaries.
5. Revisit frontend thresholds if Vitest scope changes (for example, include patterns expanded).
6. Periodically review gate signal quality:
   - Failing for real regressions, not noise.
   - Thresholds are strict enough to prevent erosion.

## Accessing Coverage Reports

### In GitHub Actions

1. Open the repository Actions tab.
2. Open the workflow run:
   - Backend gate run from `Backend Coverage Gate`, or
   - Frontend gate run from `Frontend CI`, or
   - Coverage report run from `CI Pipeline` / `Frontend Coverage`.
3. Open the Artifacts section.
4. Download the artifact:
   - `backend-coverage-gate-report`
   - `backend-coverage-report`
   - `frontend-coverage-report`
5. Extract locally and open:
   - Backend HTML report index from the extracted coverage report directory.
   - Frontend HTML report at `frontend/coverage/index.html` (artifact contents).

### Local verification

Backend (from repository root):

```bash
dotnet test backend/QueueLanka.Identity.Tests/QueueLanka.Identity.Tests.csproj --collect:"XPlat Code Coverage" --settings backend/coverage.runsettings
```

Frontend (from `frontend/`):

```bash
npm ci
npm run test:coverage
```

Then open `frontend/coverage/index.html` in a browser.

## Procedure to Update Thresholds

Update thresholds only with a clear rationale, and document the reason in the pull request.

### Backend threshold update

1. Edit `.github/workflows/backend-coverage-gate.yml`.
2. Update `MIN_LINE` value in the `coverage-gate` job environment.
3. Run backend coverage locally or in a draft PR to verify behavior.
4. Confirm artifact generation still works after the change.
5. In PR description include:
   - Current value
   - New value
   - Justification (scope increase, temporary reduction, quality uplift plan)

### Frontend threshold update

1. Edit `frontend/vite.config.ts`.
2. Update values in `test.coverage.thresholds`.
3. Run `npm run test:coverage` in `frontend/`.
4. Verify CI pass/fail behavior in PR.
5. In PR description include current vs new threshold values and justification.

### Governance recommendations

- Prefer raising thresholds incrementally.
- Avoid lowering thresholds unless there is a temporary and approved exception.
- If thresholds are lowered, create a follow-up work item to restore or exceed previous values.
- Keep gate logic and threshold values versioned in the same PR as related test-scope changes.

## Quick Reference

- Backend gate workflow: `.github/workflows/backend-coverage-gate.yml`
- Backend coverage rules: `backend/coverage.runsettings`
- Frontend gate workflow: `.github/workflows/frontend-ci.yml`
- Frontend threshold source: `frontend/vite.config.ts`
- Backend report workflow: `.github/workflows/dotnet-build.yml`
- Frontend report workflow: `.github/workflows/frontend-coverage.yml`
