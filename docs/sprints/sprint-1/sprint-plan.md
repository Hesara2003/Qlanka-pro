# Sprint 1 — Plan

**Sprint Duration:** TBD  
**Sprint Goal:** Build the core MVP and deployable foundation — authentication, booking, service centre listing, token management, CI pipeline, and containerization.

---

## Scope

| Jira Ticket | Title | Assignee | Story Points | Status |
|---|---|---|---|---|
| SCRUM-13 | Design registration and login API endpoints | | | |
| SCRUM-19 | Document registration and login flow for end users | | | |
| SCRUM-27 | Document service centre viewing feature for end users | | | |
| SCRUM-30 | Design API contract for service centre listing | | | |
| SCRUM-34 | Conduct accessibility review for service centre listing UI | | | |
| SCRUM-37 | Design token booking API contract | | | |
| SCRUM-44 | Document token booking process for end users | | | |
| SCRUM-52 | Document token viewing feature for end users | | | |
| SCRUM-54 | Design token cancellation API contract | | | |
| SCRUM-60 | Document token cancellation process for end users | | | |
| SCRUM-71 | Document service centre management features for Admins and Citizens | | | |
| SCRUM-81 | Document user management features for Admins | | | |
| SCRUM-88 | Document CI pipeline setup and usage | | | |
| SCRUM-93 | Document Docker and Docker Compose setup and usage | | | |
| SCRUM-98 | Document demo environment setup and access instructions | | | |

---

## Key Deliverables

- Repository scaffolding and CI skeleton
- Dockerfiles and containerization setup
- Initial database schema and migrations
- WSO2 API Gateway stub configuration
- Basic authentication and booking endpoints
- Citizen booking UI (React)
- Unit tests for core logic
- Playwright smoke tests for booking flow
- Deployment to staging environment

---

## Out of Scope

- Officer counter dashboard (Sprint 2)
- Real-time queue updates via SignalR (Sprint 2)
- Redis caching (Sprint 2)
- WSO2 policy enforcement (Sprint 3)
- SMS/Email reminders — mock only in MVP

---

## Dependencies / Risks

- WSO2 API Manager must be properly installed and configured separately.
- Azure App Service environment must be provisioned before staging deployment.
- Officers require a desktop or tablet with a modern browser at each service centre.
