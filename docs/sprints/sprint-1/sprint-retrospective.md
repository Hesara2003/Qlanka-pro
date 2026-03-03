# Sprint 1 — Retrospective

**Date:** March 4, 2026
**Sprint Duration:** February 19 – March 4, 2026 (14 days)
**Facilitator:** Scrum Master
**Attendees:** Full development team (Dev, DevOps, QA, BA)

---

## What Went Well ✅

- Authentication API (register + login) completed on time with clean error handling and JWT integration.
- API contract documentation (dev docs per SCRUM ticket) was thorough and well-structured.
- Branching strategy was followed consistently — 45 `feature/SCRUM-XX` branches created and merged cleanly.
- CI pipeline was set up early in the sprint, catching build issues automatically on every PR (30+ runs).
- Team communication was effective; blockers were raised and resolved quickly during standups.
- Docker Compose setup worked on all team members' machines with all four services (backend, frontend, mysql, redis).
- Health check script provided a reliable way to verify the full API stack in seconds.
- Localization (Sinhala/Tamil) was implemented across the service center UI ahead of schedule.
- Admin panels (service center management + user management) fully functional with proper role enforcement.
- Atomic stored procedures for booking and cancellation eliminated race conditions without application-level locking.

---

## What Didn't Go Well ❌

- Database migration setup took longer than estimated — blocked backend development for ~1.5 days early in the sprint.
- Email verification (SCRUM-32) was not completed; the token is generated but the SMTP send is commented out — deferred to Sprint 2.
- Password reset flow (SCRUM-33) was not started — deferred to Sprint 4.
- Real-time queue updates via SignalR were not implemented — estimated wait times are currently static (ETA is a calculated estimate).
- Story point estimates for some DevOps tasks were too optimistic, causing mild scope pressure.
- Frontend and backend integration testing started too late — API response shape mismatches (`ApiResponse<T>` wrapper inconsistency on `/api/token/my-tokens`) were only caught near the end of the sprint.
- Sprint delivered 40 of 44 planned story points (90% completion rate); 4 SP deferred.

---

## What Can Be Improved 🔧

- Start integration testing earlier — from the middle of the sprint rather than the final days.
- Add more realistic story point estimates for infrastructure and DevOps tasks.
- Set up a shared `.env.example` file for both frontend and backend to reduce environment setup issues.
- Schedule a mid-sprint sync to identify deferred items before they pile up at sprint end.
- Write unit tests alongside feature implementation (test-as-you-go) rather than at the end.

---

## Action Items

| Action | Owner | Due |
|---|---|---|
| Implement email sending for verification tokens (SCRUM-32) | Backend dev | Sprint 2, Week 1 |
| Add SignalR real-time queue updates | Backend dev | Sprint 2, Week 2 |
| Wrap `/api/token/my-tokens` in `ApiResponse<T>` for consistency | Backend dev | Sprint 2, Day 1 |
| Add `.env.example` files for frontend and backend | DevOps lead | Sprint 2, Day 1 |
| Define integration test checklist to run at sprint mid-point | QA | Sprint 2, Week 1 |
| Refine story point estimates for DevOps tasks | Scrum Master | Sprint 2 planning session |
