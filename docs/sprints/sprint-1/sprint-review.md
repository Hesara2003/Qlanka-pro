# Sprint 1  Review Report

**Date:** March 4, 2026
**Attendees:** Development Team, Scrum Master, Module Lecturer
**Sprint Duration:** February 19, 2026  March 4, 2026 (14 days)

## Sprint Goal

Build the core MVP and deployable foundation  authentication, booking, service centre listing, token management, admin panels, CI pipeline, and containerization.

---

## Completed Work

### US-C-01 — Register / Login (SCRUM-5) · 5 SP · Done
| Ticket | Title | SP | Demoed |
|--------|-------|----|--------|
| SCRUM-13 | Design registration & login API endpoints | 2 | Yes |
| SCRUM-15 | Implement JWT auth middleware | 1 | Yes |
| SCRUM-16 | Build frontend auth forms (register / login pages) | 1 | Yes |
| SCRUM-17 | Frontend form validation | 1 | Yes |
| SCRUM-19 | Document registration & login flow for end users | — | Yes |
| SCRUM-29 | Implement error handling middleware and standards | — | Yes |

### US-C-02 — View Service Centers (SCRUM-21) · 3 SP · Done
| Ticket | Title | SP | Demoed |
|--------|-------|----|--------|
| SCRUM-23 | Service center availability schema | 1 | Yes |
| SCRUM-24 | Service centers frontend UI | 1 | Yes |
| SCRUM-25 | Service center API integration | 1 | Yes |
| SCRUM-27 | Document service center viewing feature for end users | — | Yes |
| SCRUM-30 | Design API contract for service center listing | — | Yes |
| SCRUM-34 | Conduct accessibility review for service center listing UI | — | Yes |
| SCRUM-35 | Implement i18n localization (Sinhala & Tamil) | — | Yes |

### US-C-03 — Book a Token (SCRUM-36) · 8 SP · Testing
| Ticket | Title | SP | Demoed |
|--------|-------|----|--------|
| SCRUM-36 | Initial appointment database setup | 1 | Yes |
| SCRUM-37 | Design token booking API contract | 1 | Yes |
| SCRUM-38 | Implement appointment booking backend | 2 | Yes |
| SCRUM-39 | Token management and database schema | 1 | Yes |
| SCRUM-40 | Booking frontend integration | 1 | Yes |
| SCRUM-44 | Document token booking process for end users | — | Yes |
| SCRUM-47 | Implement token controller and retrieval | 1 | Yes |
| SCRUM-48 | Token schema update (cancelled_at, queue_position) | 1 | Yes |

### US-C-04 — View My Token & ETA (SCRUM-46) · 5 SP · Testing
| Ticket | Title | SP | Demoed |
|--------|-------|----|--------|
| SCRUM-49 | Frontend token UI (My Queue page, status & ETA) | 3 | Yes |
| SCRUM-50 | Integrate token UI with live API data | 2 | Yes |
| SCRUM-52 | Document token viewing feature for end users | — | Yes |

### US-C-05 — Cancel My Booking (SCRUM-53) · 3 SP · Testing
| Ticket | Title | SP | Demoed |
|--------|-------|----|--------|
| SCRUM-54 | Design token cancellation API contract | — | Yes |
| SCRUM-55 | Token cancellation backend (state machine + stored proc) | 1 | Yes |
| SCRUM-56 | Update database schema for cancellations | — | Yes |
| SCRUM-57 | Token cancellation UI (confirmation dialog) | 1 | Yes |
| SCRUM-58 | Token cancellation API integration | 1 | Yes |
| SCRUM-60 | Document token cancellation process for end users | — | Yes |
| SCRUM-63 | Cancellation error handling and result code mapping | — | Yes |

### US-A-01 — Create & View Service Centers / Admin (SCRUM-64) · 3 SP · Testing
| Ticket | Title | SP | Demoed |
|--------|-------|----|--------|
| SCRUM-65 | Service center creation and retrieval backend | 1 | Yes |
| SCRUM-66 | Service center citizen UI improvements | — | Yes |
| SCRUM-67 | Admin create service center UI | 1 | Yes |
| SCRUM-68 | Frontend service center API integration (admin) | — | Yes |
| SCRUM-69 | Service center creation validation | — | Yes |
| SCRUM-71 | Document service center management features | — | Yes |
| SCRUM-72 | Service center location schema (center_locations table) | 1 | Yes |
| SCRUM-74 | Service center API error handling | — | Yes |

### US-A-02 — View & Delete Users / Admin (SCRUM-75) · 3 SP · Testing
| Ticket | Title | SP | Demoed |
|--------|-------|----|--------|
| SCRUM-76 | User management database schema (soft-delete + audit log) | 1 | Yes |
| SCRUM-77 | Admin user management UI (badges, filters) | 1 | Yes |
| SCRUM-78 | Integrate frontend user management APIs | 1 | Yes |
| SCRUM-79 | User deletion confirmation prompt | — | Yes |
| SCRUM-81 | Document user management features for Admins | — | Yes |
| SCRUM-83 | User management API error handling | — | Yes |

### US-D-01 — CI Pipeline (SCRUM-84) · 5 SP · Idea
| Ticket | Title | SP | Demoed |
|--------|-------|----|--------|
| SCRUM-88 | Configure GitHub Actions CI (build, test, coverage, frontend) | 5 | Yes |

### US-D-02 — Docker & Docker Compose (SCRUM-89) · 3 SP · Idea
| Ticket | Title | SP | Demoed |
|--------|-------|----|--------|
| SCRUM-93 | Docker Compose setup (backend, frontend, mysql, redis) | 3 | Yes |

### US-D-03 — Staging / Demo Deployment (SCRUM-94) · 2 SP · Idea
| Ticket | Title | SP | Demoed |
|--------|-------|----|--------|
| SCRUM-98 | Azure App Service staging environment setup & documentation | 2 | Yes |

---

## Deferred / Incomplete

| Ticket | Title | SP | Reason |
|--------|-------|----|--------|
| SCRUM-32 | Email verification email sending | 3 | Token generation complete; SMTP integration deferred to Sprint 2 |
| SCRUM-33 | Password reset flow | 1 | Planned for Sprint 4 per backlog |

---

## What Was Demonstrated

1. **US-C-01 — Register / Login** — Full auth flow: register as citizen/officer/admin, receive JWT, protected routes enforced, error codes standardized.
2. **US-C-02 — View Service Centers** — Browse, search, and filter centers; live availability check; location data; Sinhala/Tamil language toggle.
3. **US-C-03 — Book a Token** — Book an appointment, receive token number (`TKN-{centerId}-{yyMMdd}-{hex4}`), atomic stored-proc booking, conflict detection.
4. **US-C-04 — View My Token & ETA** — View active and past tokens with status, dynamic queue position, and ETA capped at closing time.
5. **US-C-05 — Cancel My Booking** — Cancel a Waiting token; atomic queue-shift via stored procedure; state machine result codes.
6. **US-A-01 — Create & View Service Centers (Admin)** — Create centers with validation, upsert location, view all centers.
7. **US-A-02 — View & Delete Users (Admin)** — List/filter users, soft-delete with audit log, roles enforced, admin accounts protected.
8. **US-D-01 — CI Pipeline** — GitHub Actions: build, test, coverage report running on every PR.
9. **US-D-02 — Docker & Docker Compose** — Full stack (`backend`, `frontend`, `mysql:8.0`, `redis:7-alpine`) from `docker-compose up --build`.
10. **US-D-03 — Staging / Demo Deployment** — Azure App Service staging environment accessible to demo audience; `node scripts/health_check.js` verifying all API endpoints.

---

## Feedback from Demo

- Authentication and booking flows work end-to-end; error messages are clear and consistent.
- Localization implementation was well received; Sinhala coverage is near-complete for Sprint 1 scope.
- Suggestion: Add pagination to the service center listing for scalability.
- Suggestion: Show a countdown timer as the cancellation window approaches.
- Email verification should be prioritised early in Sprint 2 before blocking UAT.
- CI pipeline and Docker setup are considered production-quality by the module lecturer.
- Real-time queue updates (static ETA currently) should be addressed in Sprint 2.

---

## Sprint Metrics

| Metric | Value |
|--------|-------|
| Sprint duration | 14 days (Feb 19 – Mar 4, 2026) |
| User stories on board | 10 (US-C-01 to US-D-03) |
| Planned story points | 44 (40 committed + 4 deferred) |
| Completed story points | 40 |
| Velocity | 40 SP |
| Story completion rate | 90% (9 / 10 stories) |
| Deferred story points | 4 (SCRUM-32 + SCRUM-33) |
| Stories status — Done | 2 (US-C-01, US-C-02) |
| Stories status — Testing | 5 (US-C-03 to US-A-02) |
| Stories status — Idea | 3 (US-D-01 to US-D-03) |
| Test cases executed | 67 (15 UI + 52 API) |
| Test cases passed | 65 |
| Test cases failed | 2 (BUG-LOGIN-01 label mismatch; REG-04/05 UX) |
| Known open bugs | 2 (non-critical, logged) |
| Feature branches created | 45 |
| PRs merged to develop | 42 |
| CI pipeline runs | 30+ |

