# Product Overview — QueueLanka Pro

**Smart Queue & Service Optimization Platform**

> Source: Software Requirements Specification (SRS) — SE3022 Case Study Project, Semester 1 2026

---

## 1. Purpose

QueueLanka Pro is a full-stack web system designed to **digitize queue management for Sri Lankan public service centres** (e.g., RMV, hospitals). It replaces manual queue systems with an online platform that allows citizens to book appointments, track their queue position in real time, and receive reminders — while giving officers and admins tools to manage counters and analyse service performance.

---

## 2. Scope

| Capability | Included in MVP | Notes |
|---|---|---|
| Online appointment booking & digital token issuance | ✅ | Sprint 1 |
| Real-time queue position & ETA updates | ✅ | Sprint 2 |
| Officer counter workflows (call next, serve, skip) | ✅ | Sprint 2 |
| Admin analytics (wait-time reports, no-show rates) | ✅ | Sprint 3 |
| API governance via WSO2 (OAuth2, throttling, caching) | ✅ | Sprint 3 |
| CI/CD pipeline & containerized deployment | ✅ | Sprint 1 |
| SMS/Email reminders | ⏳ | Sprint 4 (mock in MVP) |
| Peak load prediction (ML prototype) | ⏳ | Sprint 4 |
| Kiosk offline sync | ⏳ | Sprint 4 (optional) |

---

## 3. Users & Roles

| Role | Description | Technical Level |
|---|---|---|
| **Citizen** | General public booking appointments and tracking queues | Low — expects intuitive UI, minimal steps |
| **Officer** | Counter staff responsible for serving citizens | Basic computer literacy — needs simple, fast interactions |
| **Administrator** | Centre managers or IT staff configuring the system and viewing analytics | Moderate — comfortable with reports and dashboards |

---

## 4. System Architecture

QueueLanka Pro is a self-contained system integrating the following components:

| Component | Technology | Purpose |
|---|---|---|
| Backend API | ASP.NET Web API (C#), ADO.NET | All business logic |
| Database | MySQL | Persistent storage |
| Cache | Redis | Live queue data, session state |
| API Gateway | WSO2 API Manager | Security, throttling, caching |
| Real-time updates | SignalR (WebSockets) | Live queue position |
| Frontend | React (Vite) | Citizen, officer, and admin UIs |
| Monitoring | Prometheus + Grafana | Metrics, dashboards, alerts |
| Logging | ELK / Loki | Centralised structured logs |
| Background jobs | Hangfire / Quartz | Predictions, reminders (optional) |
| Deployment | Docker on Azure App Service / AKS | Containerized environment |

---

## 5. Functional Requirements

### 5.1 Citizen Functions

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| FR-C01 | Register and login using username/password | Credentials validated; JWT token issued |
| FR-C02 | Book an appointment for a selected centre and time slot | Unique token number generated and stored |
| FR-C03 | View current queue position and estimated wait time (ETA) | Updates via WebSocket every 5 seconds |
| FR-C04 | Cancel an appointment up to 2 hours before scheduled time | Status changes to "cancelled"; token released |
| FR-C05 | Receive a reminder 30 minutes before the appointment | Reminder sent (mock for MVP, actual integration later) |

### 5.2 Officer Functions

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| FR-O01 | Login and view assigned counter | Only counters assigned to the officer are shown |
| FR-O02 | "Call Next" button fetches the next waiting token | Token status changes to "called"; token number displayed |
| FR-O03 | Mark the current token as "served" or "skipped" | Token status updated; queue adjusted |
| FR-O04 | View a list of waiting tokens with estimated times | Real-time list ordered by token number |
| FR-O05 | Open or close their counter | Counter status updated; no new tokens assigned when closed |

### 5.3 Admin Functions

| ID | Requirement | Acceptance Criteria |
|---|---|---|
| FR-A01 | Create, update, and delete centres, counters, and operating hours | Changes reflected immediately in the system |
| FR-A02 | Generate reports (CSV/PDF) of wait times, no-show rates, and token volumes | Report contains correct aggregated data |
| FR-A03 | Display API usage analytics from WSO2 (request counts, throttling events) | Dashboard accessible to admins |
| FR-A04 | Provide peak-load predictions for the next hour based on historical data | Prediction shown with confidence level |

---

## 6. Non-Functional Requirements

### 6.1 Performance

| ID | Requirement | Target |
|---|---|---|
| NFR-P01 | Booking API handles 2000 concurrent users over 5 min | < 2s 95th percentile response time, < 1% error rate |
| NFR-P02 | Queue polling API supports 5000 concurrent clients polling every 10s | Cache hit ratio > 80% (Redis, 5s TTL) |
| NFR-P03 | Report generation for one month of data | Completes within 10 seconds under normal load |
| NFR-P04 | Real-time queue updates via WebSocket | Delivered to all connected clients within 2 seconds of a status change |

### 6.2 Security

| ID | Requirement | Details |
|---|---|---|
| NFR-S01 | All APIs accessed through WSO2 API Gateway with OAuth2 | Tokens validated; scopes enforced |
| NFR-S02 | Role-based access control | `/public`, `/officer`, `/admin` API contexts |
| NFR-S03 | Throttling policies | Booking: 5 req/min per IP; Queue polling: 60 req/min per app |
| NFR-S04 | Passwords hashed using bcrypt or similar | Stored in users table |

### 6.3 Reliability & Availability

| ID | Requirement | Target |
|---|---|---|
| NFR-R01 | System availability during business hours (8am–6pm) | 99.5% |
| NFR-R02 | Database failure — graceful degradation with error messages | No data corruption |
| NFR-R03 | Redis down — fallback to direct DB queries | Documented in architecture, degraded performance acceptable |

### 6.4 Usability

| ID | Requirement |
|---|---|
| NFR-U01 | Citizen UI is mobile-responsive and loads within 3 seconds on 4G |
| NFR-U02 | Officer counter interface has simple, clear layout with large buttons for primary actions |

### 6.5 Maintainability & Testability

| ID | Requirement |
|---|---|
| NFR-M01 | Backend unit test code coverage ≥ 70% (measured by Coverlet) |
| NFR-M02 | Playwright E2E tests must pass before merging a PR |
| NFR-M03 | All APIs documented via Swagger/OpenAPI at `/swagger` |

---

## 7. Data Model (Core Tables)

| Table | Key Columns |
|---|---|
| `centers` | center_id (PK), name, address, timezone, capacity, created_at |
| `users` | user_id (PK), username, password_hash, role, center_id (FK), contact |
| `appointments` | appt_id (PK), user_id (FK), center_id (FK), scheduled_time, status, token_number, created_at |
| `tokens` | token_id (PK), center_id (FK), number, status, appt_id (FK), issued_at, called_at, served_at |
| `counters` | counter_id (PK), center_id (FK), name, is_open, current_token_id (FK) |
| `shifts` | shift_id (PK), user_id (FK), counter_id (FK), start_time, end_time |
| `predictions` | pred_id (PK), center_id (FK), date, hour, predicted_load, confidence |
| `audit_logs` | log_id (PK), entity, entity_id, action, performed_by, performed_at, meta (JSON) |

---

## 8. Core API Endpoints

All endpoints are prefixed by context (`/public`, `/officer`, `/admin`) and secured via WSO2.

| Endpoint | Method | Description | Role |
|---|---|---|---|
| `/api/auth/login` | POST | Authenticate user, return JWT | Public |
| `/api/centers/{id}/appointments` | POST | Create appointment | Citizen |
| `/api/centers/{id}/queue` | GET | Get live queue (with optional polling) | Citizen |
| `/api/counters/{id}/call-next` | POST | Officer calls next token | Officer |
| `/api/tokens/{id}/status` | PUT | Update token status (served/skipped) | Officer |
| `/api/reports/wait-times` | GET | Generate wait-time report | Admin |
| `/api/predictions/{centerId}` | GET | Get peak load prediction | Admin |
| `/swagger` | GET | API documentation | All |

---

## 9. Sprint Roadmap

| Sprint | Focus | Key Deliverables |
|---|---|---|
| **Sprint 1** | Core MVP & deployable foundation | Repo scaffolding, CI skeleton, Dockerfiles, DB schema, WSO2 stub, auth & booking endpoints, citizen booking UI, unit tests, Playwright smoke tests, staging deployment |
| **Sprint 2** | Live queue & officer operations | Officer dashboard, call next/serve/skip, SignalR real-time updates, Redis caching, live queue view for citizens, cancel feature, basic CSV reports, integration & E2E tests |
| **Sprint 3** | Quality, testing, performance & automation | WSO2 policy enforcement, JMeter performance tests, Prometheus & Grafana, centralised logging, admin PDF reports, API analytics dashboard, CI/CD enhancements, security testing, 70% coverage enforcement |
| **Sprint 4** | Analytics, security, UAT & release | Peak load prediction (ML), auto-suggest counter allocation, kiosk offline sync (optional), UAT, security hardening, production deployment, full documentation, demo video |

---

## 10. Testing Strategy

| Type | Tool | Scope |
|---|---|---|
| Unit tests | xUnit | Backend core business logic |
| Integration tests | xUnit + test DB | API endpoints |
| End-to-end tests | Playwright | Citizen and officer flows |
| Performance tests | Apache JMeter | Booking surge, queue polling, report generation |
| Security tests | Manual + WSO2 | Role access, rate limiting, token validation |

---

## 11. CI/CD Pipeline

### PR Pipeline (GitHub Actions)
1. Checkout code
2. Build backend (`dotnet build`)
3. Run unit tests + coverage (Coverlet)
4. Build frontend
5. Run Playwright smoke tests (headless)
6. SonarQube analysis (optional)
7. Block merge if tests or quality gates fail

### Release Pipeline
1. Build Docker images (backend + frontend)
2. Push to ACR / Docker Hub
3. Deploy to Azure App Service or AKS
4. Run DB migrations
5. Execute JMeter smoke test in staging
6. Health checks; notify team

---

## 12. Monitoring & Alerting

| Area | Tool | Detail |
|---|---|---|
| Metrics | Prometheus | Request rate, latency, error count, queue size, DB load |
| Dashboards | Grafana | Key metrics visualised |
| Logs | ELK / Loki | Centralised structured logs for debugging |
| Alerts | Grafana alerts | High error rate (> 1%), latency breach (> 2s p95), low cache hit ratio (< 70%) |

---

## 13. Definitions & Acronyms

| Term | Definition |
|---|---|
| ETA | Estimated Time of Arrival (for service at a counter) |
| WSO2 | API Manager used for API governance (authentication, throttling, caching) |
| RMV | Register of Motor Vehicles (example public service centre) |
| Token | Digital identifier representing a citizen's place in the queue |
| Counter | Physical service desk staffed by an officer |
| CI/CD | Continuous Integration / Continuous Deployment |
| JMeter | Apache JMeter — performance testing tool |
| Playwright | End-to-end testing framework |
| ADO.NET | Data access technology used in the backend |
