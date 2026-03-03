# Smoke Test Report — QueueLanka Pro API

**Date:** March 3, 2026
**Environment:** Azure App Service (Central India)
**Base URL:** `https://queuelanka-api-fwhthqd4g9e0aee2.centralindia-01.azurewebsites.net`
**Tool:** Playwright (TypeScript)
**Test User:** `healthcheck_citizen`

---

## Results Summary

| Status | Count |
|--------|-------|
| ✅ Passed | 14 |
| ❌ Failed | 0 |
| Total | 14 |

**Duration:** ~31 seconds

---

## Test Results

| # | Suite | Test | Status |
|---|-------|------|--------|
| 1 | Appointment | `GET /api/Appointment/my-bookings` — with auth returns 200 | ✅ Pass |
| 2 | Appointment | `GET /api/Appointment/my-bookings` — without auth returns 401 | ✅ Pass |
| 3 | Appointment | `POST /api/Appointment/book` — with auth returns 200 or 404/409 | ✅ Pass |
| 4 | Appointment | `POST /api/Appointment/book` — without auth returns 401 | ✅ Pass |
| 5 | Auth | `POST /api/auth/login` — valid credentials returns 200 + token | ✅ Pass |
| 6 | Auth | `POST /api/auth/login` — invalid credentials returns 401 | ✅ Pass |
| 7 | Service Center | `GET /api/service-centers` — returns 200 + array | ✅ Pass |
| 8 | Service Center | `GET /api/service-centers/1` — valid ID returns 200 | ✅ Pass |
| 9 | Service Center | `GET /api/service-centers/999999` — invalid ID returns 404 | ✅ Pass |
| 10 | Service Center | `POST /api/service-centers` — admin can create (or 401/403 if not admin) | ✅ Pass |
| 11 | Token | `GET /api/Token/my-tokens` — with auth returns 200 | ✅ Pass |
| 12 | Token | `GET /api/Token/my-tokens` — without auth returns 401 | ✅ Pass |
| 13 | Token | `PUT /api/Token/999999/cancel` — invalid token ID returns 404 | ✅ Pass |
| 14 | Token | `PUT /api/Token/1/cancel` — without auth returns 401 | ✅ Pass |

---

## Coverage

| Area | Endpoints Tested |
|------|-----------------|
| Authentication | Login (valid + invalid) |
| Appointments | Get bookings, create booking — authenticated and unauthenticated |
| Service Centers | List all, get by ID, invalid ID, create (admin) |
| Tokens | Get tokens, cancel token — authenticated and unauthenticated |

---

## Notes

- All protected endpoints correctly reject unauthenticated requests with **401**.
- `GET /api/service-centers` runs on Azure Free tier (F1) — cold-start latency observed (~6s on first hit).
- `POST /api/Appointment/book` accepts **200**, **404** (no matching service center), or **409** (slot conflict) as valid responses depending on live data state.
- Tests run with `--workers=1` (sequential) to avoid race conditions on shared Azure DB.

---

## How to Run

```bash
cd QueueLanka.SmokeTests
npm install
npx playwright install chromium
npx playwright test --workers=1
```
