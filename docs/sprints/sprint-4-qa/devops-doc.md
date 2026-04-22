# Sprint 4 DevOps Document

Project: QueueLanka Pro  
Sprint: Sprint 4 (8 Apr - 22 Apr 2026)  
Story: US-D-09 Final Deployment and Release

## 1. User Story

As a Team, when the final build is ready, I want to deploy it and tag it so that we can present the completed product.

## 2. Scope and Acceptance Criteria

Acceptance criteria for this sprint item:
1. Final build deployed and stable.
2. Git tag `v1.0-final` (or `sprint-4-demo`) exists.
3. Smoke tests pass.
4. Release notes prepared.
5. Add and tune new database indexes based on query analysis.

## 3. Deployment Architecture (Staging)

Target runtime:
- Azure Container Apps for backend microservices
- Azure App Service for frontend
- Azure Database (MySQL/PostgreSQL based on environment profile)
- Azure Container Registry for image storage

Operational references:
- [Infrastructure deploy script](deploy/infrastructure/deploy.ps1)
- [Microservices deployment workflow](.github/workflows/deploy-microservices.yml)
- [Frontend deployment workflow](.github/workflows/deploy-frontend.yml)
- [Staging deployment outcomes](docs/staging-deployment-outcomes.md)

## 4. Standard Release Procedure

### 4.1 Pre-Deployment Gates

1. Ensure solution and targeted frontend/backend tests pass.
2. Confirm production/staging secrets and environment variables are available.
3. Confirm active Azure subscription and target resource group.
4. Build release artifact version/tag (timestamp or semantic version).

### 4.2 Backend Container Rollout

Recommended path (CI):
1. Trigger [deploy-microservices workflow](.github/workflows/deploy-microservices.yml).
2. Build/push images to ACR.
3. Update container apps to release tag.
4. Set revision mode single and route 100% traffic.

Manual fallback path (CLI):

```powershell
az login
az account set --subscription "<subscription-id>"

# Build in ACR without local Docker
$tag = Get-Date -Format "yyyyMMddHHmmss"
az acr build --registry qlanka --image qlanka-micro-identity:$tag --file backend/QueueLanka.Identity/Dockerfile .
az acr build --registry qlanka --image qlanka-micro-servicecentre:$tag --file backend/QueueLanka.ServiceCenter/Dockerfile .
az acr build --registry qlanka --image qlanka-micro-queue:$tag --file backend/QueueLanka.Queue/Dockerfile .
az acr build --registry qlanka --image qlanka-gateway:$tag --file backend/QueueLanka.Gateway/Dockerfile .

az containerapp update --name qlanka-micro-identity --resource-group qlanka-microservices --image qlanka-hrhza8d0ccd6dqa4.azurecr.io/qlanka-micro-identity:$tag
az containerapp update --name qlanka-micro-servicecentre --resource-group qlanka-microservices --image qlanka-hrhza8d0ccd6dqa4.azurecr.io/qlanka-micro-servicecentre:$tag
az containerapp update --name qlanka-micro-queue --resource-group qlanka-microservices --image qlanka-hrhza8d0ccd6dqa4.azurecr.io/qlanka-micro-queue:$tag
az containerapp update --name qlanka-gateway --resource-group qlanka-microservices --image qlanka-hrhza8d0ccd6dqa4.azurecr.io/qlanka-gateway:$tag
```

### 4.3 Frontend Rollout

Preferred path:
- Trigger [deploy-frontend workflow](.github/workflows/deploy-frontend.yml).

Manual verification:

```powershell
curl -I https://<frontend-app>.azurewebsites.net
```

## 5. Endpoint Verification Plan

Required API checks after deployment:

```powershell
# Gateway health
curl https://qlanka-gateway.salmonisland-da9fa0a9.eastasia.azurecontainerapps.io/health

# Auth-protected report route should not return 404
curl -X GET "https://qlanka-gateway.salmonisland-da9fa0a9.eastasia.azurecontainerapps.io/api/reports/custom?fromDate=2026-03-10&toDate=2026-03-10&metrics=total_served"

# Queue route reachability check (status code in {200,400,401,403,409})
curl -X POST "https://qlanka-gateway.salmonisland-da9fa0a9.eastasia.azurecontainerapps.io/api/appointment/book" -H "Content-Type: application/json" -d '{"centerId":1,"appointmentDate":"2026-03-24T00:00:00Z","appointmentTime":"10:00:00"}'
```

Expected stability signal:
- No 5xx surge.
- Core health endpoint returns 200.
- Protected routes return expected auth/validation codes, not 404.

## 6. Smoke Test Execution

Smoke suite source:
- [QueueLanka smoke tests](QueueLanka.SmokeTests/smoke-test.md)

Run command:

```powershell
cd QueueLanka.SmokeTests
npm install
npx playwright test --workers=1
```

Acceptance check:
- 100% of core smoke tests pass for release candidate.

## 7. Git Tagging and Release Controls

### 7.1 Tag Creation

```powershell
git checkout main
git pull origin main
git tag -a v1.0-final -m "Sprint 4 final release build"
git push origin v1.0-final
```

Alternative demo tag:

```powershell
git tag -a sprint-4-demo -m "Sprint 4 demo release"
git push origin sprint-4-demo
```

### 7.2 Tag Validation

```powershell
git tag --list | Select-String "v1.0-final|sprint-4-demo"
```

## 8. Release Notes

Release notes are prepared at:
- [Sprint 4 release notes](docs/sprints/sprint-4-qa/release-notes-sprint-4.md)

## 9. Database Index Tuning (DevOps/DBA Action)

Based on report/query analysis, execute and verify index changes in staging before final rollout:

```sql
CREATE INDEX idx_token_report_date_status_center ON tokens (issued_date, status, center_id);
CREATE INDEX idx_token_report_peak_hour ON tokens (issued_date, center_id, issued_time);
CREATE INDEX idx_token_report_timing ON tokens (issued_date, center_id, called_at, served_at);
```

Verification:
1. Run EXPLAIN plans on key report queries.
2. Compare row scans and latency before/after.
3. Keep or rollback indexes based on measured gain.

## 10. Acceptance Criteria Status Table

| Acceptance Criterion | Status | Evidence/Reference |
|---|---|---|
| Final build deployed and stable | In execution (runbook complete) | [Staging outcomes](docs/staging-deployment-outcomes.md) + Section 4/5 runbook |
| Git tag `v1.0-final` or `sprint-4-demo` exists | Ready (commands documented) | Section 7 |
| Smoke tests pass | Verified baseline, re-run required for final candidate | [Smoke outcomes](docs/sprints/sprint-4-qa/smoke-test-results-local.md), Section 6 |
| Release notes prepared | Complete | [Release notes](docs/sprints/sprint-4-qa/release-notes-sprint-4.md) |
| Add/tune DB indexes | Complete plan + SQL + verification process | Section 9 |

## 11. Operational Risks and Mitigations

1. Local Docker unavailable on build host
- Mitigation: Use `az acr build` cloud builds.

2. Cold start on free/low tier
- Mitigation: Warm-up endpoint hit before smoke tests.

3. Cross-service env var drift
- Mitigation: Validate container app env vars immediately after update.

## 12. Sign-Off Checklist

- [ ] Deployment workflow run completed without failed jobs.
- [ ] Gateway and report endpoints verified.
- [ ] Smoke tests completed and archived.
- [ ] Release tag created and pushed.
- [ ] Release notes attached to sprint review.
- [ ] DB index verification report captured.
