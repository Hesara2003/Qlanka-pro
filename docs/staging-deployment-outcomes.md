# Staging Deployment Process and Outcomes

This document outlines the end-to-end deployment lifecycle for the Qlanka-pro staging environment, including infrastructure provisioning, automated workflows, and verification results.

## Deployment Process Overview

The deployment follows a multi-stage automated process targeting the **Azure (Central India)** region.

### 1. Infrastructure Provisioning
**Tooling**: PowerShell + Azure Bicep
**Action**: The `deploy/infrastructure/deploy.ps1` script executes the `main.bicep` template.
-   **Resources Created**:
    -   Azure Resource Group (`rg-queuelanka-pro`)
    -   Azure PostgreSQL Flexible Server (Database)
    -   Azure Container Apps Environment (Microservices host)
    -   Azure App Service (Frontend host)

### 2. Backend Microservices Deployment
**Workflow**: `.github/workflows/deploy-microservices.yml`
-   **Build**: 5 microservices (`gateway`, `identity`, `servicecenter`, `queue`, `notification`) are built as Docker images.
-   **Push**: Images are pushed to Azure Container Registry (`qlankaregistry.azurecr.io`).
-   **Update**: Container Apps are updated to pull the `latest` images.

### 3. Frontend Deployment
**Workflow**: `.github/workflows/deploy-frontend.yml`
-   **Process**: Node.js build (Vite) with production environment variables.
-   **Deployment**: Package pushed to Azure App Service via `azure/webapps-deploy`.
-   **Verification**: A built-in post-deployment step performs a health check via `curl`.

---

## Verification & Smoke Test Results

### 1. Automated Verification (Pipeline)
The frontend deployment include a 10-attempt retry loop to verify site availability.
-   **Result**: Frontend successfully verified on first attempt (HTTP 200).

### 2. Smoke Test Suite (Playwright)
A dedicated Playwright suite (`QueueLanka.SmokeTests`) was executed against the staging environment on **March 3, 2026**.

| Status | Count |
|--------|-------|
| ✅ Passed | 14 |
| ❌ Failed | 0 |
| **Total** | **14** |

#### Key Scenarios Tested:
-   **Authentication**: Login with valid/invalid credentials.
-   **Service Center**: Listing and detail retrieval across microservices.
-   **Tokens**: Secure token issuance and cancellation workflows.
-   **Appointments**: End-to-end booking flow including slots and conflict checks.

---

## Issues & Mitigations

During the staging rollout, the following observations were documented:

1.  **Cold-Start Latency**:
    -   **Issue**: Initial requests to the backend API via Azure F1 (Free) tier took ~6s due to container spin-up.
    -   **Mitigation**: The Playwright suite includes a "Warm-up" hit to the root API before starting timed tests.

2.  **Sequential Test Requirement**:
    -   **Issue**: Concurrent tests caused intermittent `409 Conflict` errors during token booking on the shared database.
    -   **Mitigation**: Tests are now run with `--workers=1` to ensure sequential execution.

## Conclusion

The staging deployment process is fully automated and verified. The system is stable, with all 14 core smoke tests passing.
