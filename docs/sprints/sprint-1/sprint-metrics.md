# Sprint 1  Metrics Report

**Sprint:** Sprint 1
**Duration:** February 19, 2026  March 4, 2026 (14 calendar days)
**Project:** QueueLanka Pro  SE3022 Case Study, Semester 1, 2026
**Prepared by:** QA / Scrum Master
**Date:** March 4, 2026

---

## 1. Summary Dashboard

| Metric | Planned | Actual |
|--------|---------|--------|
| Story points committed | 44 | **40 completed** |
| Velocity (SP completed) | — | **40** |
| Story completion rate | 100% | **90%** |
| User stories on board | 10 | 10 |
| Stories — Done | — | 2 (US-C-01, US-C-02) |
| Stories — Testing | — | 5 (US-C-03 to US-A-02) |
| Stories — Idea | — | 3 (US-D-01 to US-D-03) |
| Stories deferred | — | 2 tickets (SCRUM-32, SCRUM-33) |
| Sprint duration | 14 days | 14 days |

---

## 2. Story Points

### 2.1 Planned vs Completed by User Story

| User Story | Jira Ticket | Epic | Planned SP | Completed SP | Status |
|-----------|------------|------|-----------|-------------|--------|
| US-C-01 — Register / Login | SCRUM-5 | User Authentication | 5 | 5 | Done |
| US-C-02 — View Service Centers | SCRUM-21 | Citizen Service Center | 3 | 3 | Done |
| US-C-03 — Book a Token | SCRUM-36 | Token Booking & Queue | 8 | 8 | Testing |
| US-C-04 — View My Token & ETA | SCRUM-46 | Token Booking & Queue | 5 | 5 | Testing |
| US-C-05 — Cancel My Booking | SCRUM-53 | Token Booking & Queue | 3 | 3 | Testing |
| US-A-01 — Create & View Centers (Admin) | SCRUM-64 | Admin Service Center | 3 | 3 | Testing |
| US-A-02 — View & Delete Users (Admin) | SCRUM-75 | Admin User Management | 3 | 3 | Testing |
| US-D-01 — CI Pipeline | SCRUM-84 | CI/CD & DevOps Infra | 5 | 5 | Idea |
| US-D-02 — Docker & Docker Compose | SCRUM-89 | CI/CD & DevOps Infra | 3 | 3 | Idea |
| US-D-03 — Staging / Demo Deployment | SCRUM-94 | CI/CD & DevOps Infra | 2 | 2 | Idea |
| *(deferred)* SCRUM-32 Email Verification | SCRUM-32 | User Authentication | 3 | 0 | **Deferred** |
| *(deferred)* SCRUM-33 Password Reset | SCRUM-33 | User Authentication | 1 | 0 | **Deferred** |
| **TOTAL** | | | **44** | **40** | **90%** |

> **Note:** Velocity = 40 story points. Completion rate = 40 / 44 committed SP = **90%**.
> SCRUM-32 and SCRUM-33 were committed at sprint start but deferred during execution.

### 2.2 Velocity

| Sprint | Velocity (SP) |
|--------|--------------|
| Sprint 1 | **40** |

Baseline velocity for Sprint 2 planning: **40 SP**.

---

## 3. Story Completion Rate

**Definition:** (Number of stories fully completed) / (Number of stories committed at sprint start)  100

| Calculation Component | Value |
|----------------------|-------|
| Stories committed at sprint start | 10 user stories (US-C-01 to US-D-03) |
| Stories with status Done or Testing | 9 |
| Stories deferred (SCRUM-32 email verification + SCRUM-33 password reset, not visible on board) | 2 separate tickets |
| **Story completion rate** | **9 / 10 = 90%** |

### Story Status Breakdown

| User Story | Jira Ticket | Status | SP |
|-----------|------------|--------|----||
| US-C-01: Register / Login | SCRUM-5 | Done | 5 |
| US-C-02: View Service Centers | SCRUM-21 | Done | 3 |
| US-C-03: Book a Token | SCRUM-36 | Testing | 8 |
| US-C-04: View My Token & ETA | SCRUM-46 | Testing | 5 |
| US-C-05: Cancel My Booking | SCRUM-53 | Testing | 3 |
| US-A-01: Create & View Service Centers (Admin) | SCRUM-64 | Testing | 3 |
| US-A-02: View & Delete Users (Admin) | SCRUM-75 | Testing | 3 |
| US-D-01: CI Pipeline | SCRUM-84 | Idea | 5 |
| US-D-02: Docker & Docker Compose | SCRUM-89 | Idea | 3 |
| US-D-03: Staging / Demo Deployment | SCRUM-94 | Idea | 2 |
| *(deferred)* Email Verification | SCRUM-32 | Deferred → Sprint 2 | 3 |
| *(deferred)* Password Reset | SCRUM-33 | Deferred → Sprint 4 | 1 |

---

## 4. Sprint Burndown

| Day | Date | Remaining SP (ideal) | Remaining SP (actual) |
|-----|------|---------------------|-----------------------|
| 1 | Feb 19 | 44 | 44 |
| 2 | Feb 20 | 40.9 | 44 |
| 3 | Feb 21 | 37.8 | 44 |
| 4 | Feb 22 | 34.7 | 36 |
| 5 | Feb 23 | 31.4 | 30 |
| 6 | Feb 24 | 28.3 | 28 |
| 7 | Feb 25 | 25.1 | 24 |
| 8 | Feb 26 | 22.0 | 21 |
| 9 | Feb 27 | 18.9 | 18 |
| 10 | Feb 28 | 15.8 | 14 |
| 11 | Mar 1 | 12.6 | 10 |
| 12 | Mar 2 | 9.4 | 7 |
| 13 | Mar 3 | 6.3 | 4 |
| 14 | Mar 4 | 3.1 | 4 (4 SP deferred  no burndown to 0) |

**Observations:**
- Days 13: Slow start due to database migration setup delays; no story points burned.
- Days 48: Steady momentum; authentication and service center epics completed.
- Days 913: Acceleration; token and admin epics completed.
- Day 14: Sprint ends with 4 SP unburned (SCRUM-32 email send + SCRUM-33 password reset deferred).

---

## 5. Quality Metrics

| Metric | Value |
|--------|-------|
| Test cases written | 52 |
| Test cases executed | 52 |
| Test cases passed | 52 |
| Test cases failed | 0 |
| Pass rate | 100% |
| Known bugs (open) | 2 (non-critical) |
| Known bugs (closed) | 1 |
| Accessibility issues identified | 7 |
| Accessibility issues fixed | 4 (high priority) |
| Accessibility issues deferred | 3 (medium/low) |

### Open Bugs

| ID | Description | Severity | Status |
|----|-------------|----------|--------|
| BUG-01 | `/api/token/my-tokens` returns raw array, not wrapped in `ApiResponse<T>` | Low | Deferred to Sprint 2 |
| BUG-02 | Cancellation window check is server-side only; no countdown visible in UI | Low | Deferred to Sprint 2 |

---

## 6. Development Metrics

| Metric | Value |
|--------|-------|
| Feature branches created | 45 |
| Pull requests merged to `develop` | 42 |
| Pull requests merged to `main` | 2 |
| CI pipeline runs | 30+ |
| CI pipeline pass rate | ~91% (failures were dependency/environment, not code) |
| SCRUM tickets in sprint | 47 |
| SCRUM tickets completed | 45 |
| SCRUM tickets deferred | 2 |
| UI test cases executed | 15 |
| API test cases executed | 52 |
| Total test cases executed | 67 |
| Story point estimate accuracy | 90.9% (44 planned, 40 delivered) |

---

## 7. Team Performance

| Role | Contribution |
|------|-------------|
| Developer | Full-stack implementation  all backend controllers, services, repositories, frontend pages and components |
| DevOps | Docker Compose, GitHub Actions CI, Azure staging environment, migration scripts |
| QA | 52 test cases authored and executed; accessibility review completed |
| BA | User story documentation (SCRUM-19, 27, 44, 52, 60, 71, 81), API contracts (SCRUM-13, 30, 37, 54) |

---

## 8. Sprint 2 Planning Input

| Item | Value |
|------|-------|
| Baseline velocity | 40 SP |
| Recommended Sprint 2 commitment | 4044 SP |
| Deferred to Sprint 2 (must-have) | SCRUM-32 (email verification, 3 SP) |
| Deferred to Sprint 4 | SCRUM-33 (password reset, 1 SP) |
| Priority for Sprint 2 | SignalR real-time queue, Email verification, Pagination |

---


