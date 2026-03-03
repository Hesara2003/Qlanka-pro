# Sprint 1 — DevOps Documentation

**Sprint:** Sprint 1
**Project:** QueueLanka Pro
**Date:** March 2, 2026

---

## 1. Repository Structure

```
Qlanka-pro/
├── backend/
│   └── QueueLanka.API/        # ASP.NET Core 8 Web API
├── frontend/                  # React + Vite + TypeScript
├── scripts/                   # Utility scripts (seed, migrate, health check)
├── docs/                      # All project documentation
├── Qlanka-pro.sln             # Visual Studio solution file
└── README.md
```

---

## 2. Branching Strategy

This project follows a **Jira-linked GitFlow** model. See [branching-strategy.md](../../branching-strategy.md) for full details.

| Branch | Purpose |
|---|---|
| `main` | Production-ready. Merged via Pull Requests only. |
| `develop` | Integration branch — all features merge here first. |
| `feature/SCRUM-XX-description` | One branch per Jira ticket. |
| `bugfix/SCRUM-XX-description` | Non-urgent bug fixes. |
| `hotfix/SCRUM-XX-description` | Urgent production fixes — branch from `main`. |

### Branch Naming Examples
```
feature/SCRUM-13-auth-api
feature/SCRUM-37-token-booking-api
bugfix/SCRUM-45-fix-login-null-reference
```

---

## 3. Local Development Setup

### 3.1 Prerequisites

| Tool | Version | Install |
|---|---|---|
| .NET SDK | 8.0 | https://dotnet.microsoft.com/download |
| Node.js | 20.x LTS | https://nodejs.org |
| MySQL | 8.0 | https://dev.mysql.com/downloads |
| Git | Latest | https://git-scm.com |
| Docker (optional) | Latest | https://www.docker.com |

### 3.2 Clone the Repository

```bash
git clone https://github.com/<org>/Qlanka-pro.git
cd Qlanka-pro
```

### 3.3 Backend Setup

1. Navigate to the API project:
   ```bash
   cd backend/QueueLanka.API
   ```

2. Copy and configure app settings:
   ```bash
   cp appsettings.json appsettings.Development.json
   ```

3. Update `appsettings.Development.json` with your local values:
   ```json
   {
     "ConnectionStrings": {
       "Default": "Server=localhost;Database=queuelanka_dev;User=root;Password=yourpassword;"
     },
     "Jwt": {
       "Secret": "your-secret-key-at-least-32-characters",
       "Issuer": "queuelanka-api",
       "Audience": "queuelanka-client",
       "AccessTokenExpiryMinutes": 60,
       "RefreshTokenExpiryDays": 7
     },
     "App": {
       "BackendBaseUrl": "http://localhost:5000",
       "FrontendBaseUrl": "http://localhost:5173"
     }
   }
   ```

4. Restore dependencies and run migrations:
   ```bash
   dotnet restore
   node ../../scripts/migrate.js
   ```

5. (Optional) Seed test data:
   ```bash
   node ../../scripts/seed.js
   ```

6. Start the backend:
   ```bash
   dotnet run
   ```
   API available at: `http://localhost:5000`
   Swagger UI: `http://localhost:5000/swagger`

### 3.4 Frontend Setup

1. Navigate to the frontend:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```
   Update `.env`:
   ```
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

4. Start the dev server:
   ```bash
   npm run dev
   ```
   Frontend available at: `http://localhost:5173`

---

## 4. Environment Variables

### Backend (`appsettings.json` / environment)

| Key | Description | Example |
|---|---|---|
| `ConnectionStrings__Default` | MySQL connection string | `Server=localhost;Database=queuelanka;...` |
| `Jwt__Secret` | JWT signing secret (min 32 chars, HMAC-SHA256) | Set via environment variable — never commit |
| `Jwt__Issuer` | JWT issuer claim | `queuelanka-api` |
| `Jwt__Audience` | JWT audience claim | `queuelanka-client` |
| `Jwt__AccessTokenExpiryMinutes` | Access token lifetime in minutes | `60` |
| `Jwt__RefreshTokenExpiryDays` | Refresh token lifetime in days | `7` |
| `App__BackendBaseUrl` | Backend base URL | `http://localhost:5000` |
| `App__FrontendBaseUrl` | Frontend base URL | `http://localhost:5173` |

> ⚠️ Never commit real secrets to source control. Use environment variables or a secrets manager in production.

### Frontend (`frontend/.env`)

| Key | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:5000/api` |

---

## 5. Middleware Pipeline & Auth Behaviour (from `Program.cs`)

The ASP.NET Core middleware pipeline runs in this order:

```
ExceptionMiddleware  →  Swagger (Dev only)  →  HTTPS Redirect (Prod only)  →  CORS  →  Authentication  →  Authorization  →  Controllers
```

### JWT Validation Settings

| Setting | Value |
|---------|-------|
| Algorithm | HMAC-SHA256 |
| Clock skew | `TimeSpan.Zero` (zero tolerance on expiry) |
| Validate Issuer | Yes (`queuelanka-api`) |
| Validate Audience | Yes (`queuelanka-client`) |
| Validate Lifetime | Yes |
| Validate Signing Key | Yes |

### Auth Error Codes (custom `JwtBearerEvents`)

| Condition | HTTP Status | Code |
|-----------|------------|------|
| No `Authorization` header | 401 | `TOKEN_MISSING` |
| Token present but invalid/expired | 401 | `TOKEN_INVALID` |
| Valid token, insufficient role | 403 | `FORBIDDEN` |

### CORS Policy

Policy `AllowFrontend` is applied globally. In Development it allows any `localhost` or `127.0.0.1` origin with any headers and methods. **Restrict to specific origins before production deployment.**

### Dependency Injection (all Scoped)

| Interface | Implementation |
|-----------|---------------|
| `IUserRepository` | `UserRepository` |
| `IServiceCenterRepository` | `ServiceCenterRepository` |
| `IAppointmentRepository` | `AppointmentRepository` |
| `ITokenRepository` | `TokenRepository` |
| `IEmailVerificationRepository` | `EmailVerificationRepository` |
| `IAuthService` | `AuthService` |
| `IServiceCenterService` | `ServiceCenterService` |
| `IAppointmentService` | `AppointmentService` |
| `ITokenService` | `TokenService` |
| `IUserManagementService` | `UserManagementService` |
| `IEmailService` | `SmtpEmailService` |
| `INotificationService` | `NotificationService` |

---

## 6. Database Migrations

Migrations are managed via script:

```bash
# Run from repo root
node scripts/migrate.js
```

Or using the .NET migration runner:

```bash
cd backend/QueueLanka.API
dotnet ef database update
```

Migration files are located in: `backend/QueueLanka.API/Database/Migrations/`

---

## 7. Docker & Docker Compose (SCRUM-93)

### 6.1 Build & Run All Services

```bash
# From repo root
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:5000 |
| MySQL | localhost:3306 |
| Redis | localhost:6379 |

### 6.2 `docker-compose.yml` Summary

```yaml
services:
  mysql:     # MySQL 8.0, port 3306, persistent volume
  redis:     # Redis 7 Alpine, port 6379
  backend:   # ASP.NET Core 8, port 5000→8080
  frontend:  # React/Nginx, port 5173→80
```

### 6.3 Stop & Clean Up

```bash
docker-compose down          # Stop containers
docker-compose down -v       # Stop + remove volumes (resets DB)
```

---

## 8. CI/CD Pipeline (SCRUM-88)

### 7.1 Overview

CI is implemented with **GitHub Actions**. The pipeline runs automatically on every Pull Request targeting `main`.

**Workflow file:** `.github/workflows/ci.yml`

### 7.2 Pipeline Steps

| Step | Command | Description |
|---|---|---|
| Checkout | `actions/checkout@v4` | Pull source code |
| Setup .NET | `setup-dotnet@v3` | Install .NET 8 SDK |
| Restore | `dotnet restore` | Restore NuGet packages |
| Build | `dotnet build --configuration Release` | Compile the backend |
| Test | `dotnet test --collect:"XPlat Code Coverage"` | Run unit tests with coverage |
| Coverage upload | `coverallsapp/github-action@v2` | Upload coverage report to Coveralls |
| Frontend build | `npm ci && npm run build` | Build the React app |
| E2E tests | `npx playwright test` | Run Playwright smoke tests |

### 7.3 Rules

- PRs **cannot** be merged if any pipeline step fails.
- Coverage report is posted as a PR comment.
- All feature branches must be up to date with `develop` before merging.

---

## 9. Health Check Script

A Node.js script verifies the full API surface is working correctly.

### Setup test users (first time only):
```bash
node scripts/setup_test_users.js
```

### Run health check only:
```bash
node scripts/health_check.js
```

### With custom API base:
```bash
API_BASE=http://localhost:5000/api node scripts/health_check.js
```

**Test credentials:**
| Role | Username | Password |
|---|---|---|
| Admin | `healthcheck_admin` | `Health@Check1` |
| Citizen | `healthcheck_citizen` | `Health@Check1` |

---

## 10. Demo / Staging Environment (SCRUM-98)

The staging environment is hosted on **Azure App Service**.

| Resource | URL |
|---|---|
| Frontend | https://queuelanka-demo.azurewebsites.net |
| Backend API | https://queuelanka-api.azurewebsites.net |
| Swagger UI | https://queuelanka-api.azurewebsites.net/swagger |

**Demo credentials:**
| Role | Username | Password |
|---|---|---|
| Citizen | `citizen1@demo.com` | `Demo123!` |
| Officer | `officer1@demo.com` | `Demo123!` |
| Admin | `admin@demo.com` | `Demo123!` |

> The demo environment resets every 24 hours.

---

## 11. Useful Commands Reference

| Task | Command |
|---|---|
| Start backend | `dotnet run` (from `backend/QueueLanka.API`) |
| Start frontend | `npm run dev` (from `frontend/`) |
| Run all tests | `dotnet test` |
| Run health check | `node scripts/health_check.js` |
| Run migrations | `node scripts/migrate.js` |
| Seed database | `node scripts/seed.js` |
| Start with Docker | `docker-compose up --build` |
| Lint frontend | `npm run lint` (from `frontend/`) |
| Build frontend | `npm run build` (from `frontend/`) |
