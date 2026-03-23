# Development Report

## Project
QueueLanka Pro

## Report Date
March 23, 2026

## Scope
This report documents the implemented system architecture and development work across:
- Backend services
- Frontend application
- Database and data lifecycle

It intentionally excludes QA execution details and test-result reporting.

---

## 1) Backend Architecture

### 1.1 Service Topology
QueueLanka Pro is organized as a multi-service backend with clear domain boundaries:
- **QueueLanka.Gateway**: Edge entry point and reverse proxy routing.
- **QueueLanka.Identity**: Authentication, user identity, and user management capabilities.
- **QueueLanka.ServiceCenter**: Service center metadata and administrative center operations.
- **QueueLanka.Queue**: Appointment, token lifecycle, counter operations, reporting, and real-time queue communication.
- **QueueLanka.Notification**: Outbound notification responsibilities.
- **QueueLanka.Shared**: Common middleware, filters, and shared contracts reused across services.

### 1.2 API Gateway and Routing
Gateway behavior is implemented via YARP reverse proxy configuration:
- Routes requests by path prefix to Identity, ServiceCenter, and Queue service clusters.
- Proxies both REST endpoints and hub endpoints (`/hubs/*`) for real-time communication.
- Applies frontend CORS policy with origin validation that supports local and cloud-hosted frontend origins.

Representative routed domains include:
- Authentication and admin user operations (`/api/auth/*`, `/api/admin/users/*`)
- Service-center APIs (`/api/service-centers/*`)
- Queue APIs (`/api/appointment/*`, `/api/token/*`, `/api/counters/*`, `/api/admin/centers/*`)
- Real-time hub traffic (`/hubs/*`)

### 1.3 Security and Identity Model
Security implementation follows JWT bearer token authentication across services:
- Token validation with issuer/audience/signing-key checks.
- Authorization policies for role-restricted operations (e.g., admin/officer role gates in queue domain).
- Shared exception-handling middleware and request validation filters in service pipelines.

In the API service, unauthorized and forbidden flows are normalized to structured JSON responses for consistent frontend error handling.

### 1.4 Domain Responsibilities by Service

#### Identity Service
- User registration/login and token issuing.
- Email verification workflows and verification token persistence.
- User management operations exposed for administrative flows.

#### ServiceCenter Service
- Service-center profile data management.
- Center-related configuration and retrieval operations consumed by queue workflows.

#### Queue Service
- Appointment and token lifecycle orchestration.
- Counter lifecycle management and officer-facing counter actions.
- Audit and report data persistence through dedicated repositories.
- Integration with ServiceCenter service via HTTP client for cross-domain checks.

### 1.5 Real-Time Backend Design
Real-time queue updates are implemented through SignalR in `QueueLanka.Queue`:
- Hub endpoint mapped at `/hubs/queue`.
- Group-based fan-out model using center groups and counter groups.
- Broadcast service emits domain events such as:
  - token called
  - token status updated (served/skipped)
  - token reassigned
  - queue updated
  - counter status changed

This design keeps queue state communication near-real-time while preserving service-level separation from frontend UI concerns.

### 1.6 Backend Cross-Cutting Patterns
- Health check endpoint exposure in each runtime service.
- Swagger/OpenAPI enabled for service contract visibility.
- Repository/service layering for separation of business logic and persistence logic.
- Centralized DI registration per service startup pipeline.

---

## 2) Frontend Architecture

### 2.1 Core Stack
The frontend is a React + TypeScript single-page application using:
- Vite build tooling
- React Router for route-level composition
- Axios for HTTP client abstraction
- SignalR client for live queue events
- Tailwind CSS for styling
- i18n and charting support through configured libraries

### 2.2 Routing and Access Control
Frontend routing in `src/App.tsx` is structured by access tier:
- Public routes (landing, login, register)
- Authenticated citizen routes (dashboard, service centers, booking, live queue)
- Admin routes (admin dashboard, service-center management, user management, counter management)
- Officer route (officer dashboard)

Route guards (`ProtectedRoute`, `AdminRoute`, `OfficerRoute`) enforce role-aware navigation and isolate role-specific layouts.

### 2.3 API Integration Layer
The client API layer under `src/api` encapsulates service operations by domain:
- Authentication
- Service centers
- Appointments
- Tokens
- Counters and counter management
- User administration

The shared axios instance provides:
- Environment-driven base URL resolution
- JWT header injection from local storage
- Standard handling for auth failures (session cleanup and login redirection)
- Typed authorization error mapping for `403` responses

### 2.4 Frontend State and Feature Hooks
Feature hooks under `src/hooks` modularize domain logic, including:
- token and counter workflows
- service-center data loading
- page visibility/reactivity helpers
- live queue hub integration

### 2.5 Real-Time Client Behavior
`useQueueHub` implements resilient SignalR connectivity with:
- connection state tracking (`connecting`, `reconnecting`, `connected`, `disconnected`)
- group join/leave behavior by center and officer counter context
- event de-duplication for repeated payloads
- reconnect strategy with bounded retry delays
- token refresh support for expired access tokens

This allows the UI to consume queue updates continuously and keep operational dashboards synchronized with backend events.

---

## 3) Database and Data Layer

### 3.1 Database Topology
The system uses MySQL and separates data by service boundary in containerized deployment:
- `identity_db` for identity domain data
- `servicecenters_db` for service-center domain data
- `queue_db` for queue/appointment/token/counter domain data

This separation supports domain isolation and independent service ownership.

### 3.2 Migration Strategy
Each service owns its migration history under its `Database/Migrations` directory:
- **Identity**: baseline identity schema migration.
- **ServiceCenter**: baseline service-center schema migration.
- **Queue**: iterative queue-domain migrations including queue schema, counter schema, token status management, audit, reassignment audit, and counter management schema.
- **API (legacy/aggregate migration history)**: SQL migrations covering foundational entities (centers, users, email verification, availability, appointments, tokens, locations, user audit, and booking/cancel queue atomic updates).

### 3.3 Queue Data Model Highlights
Queue-domain persistence includes core entities and operational fields for real-time queue execution:
- appointments
- tokens (status, queue position, lifecycle timestamps)
- counters
- audit logs

The queue schema includes indexed access patterns for center/date/status operations, and stored procedures for transactional operations such as booking and cancellation with queue-position shifting.

### 3.4 Repository-Level Data Access
Repository abstractions are implemented per domain service:
- **Identity Data**: user and email-verification repositories.
- **ServiceCenter Data**: service-center repository.
- **Queue Data**: appointment, token, counter, report, and audit repositories.

This keeps SQL-centric persistence logic concentrated in data-layer components and avoids controller-level query coupling.

### 3.5 Data Seeding and Environment Setup
Project scripts under `scripts/` support operational setup activities:
- migration execution for local environments
- initial data seeding (centers/locations/operating patterns and users)
- identity and center synchronization helpers

These scripts make local and staged environments reproducible and reduce manual provisioning work.

### 3.6 Data Integrity and Cross-Service Constraints
Because the architecture is service-oriented, some cross-service integrity (for example center validation from queue workflows) is enforced at application/integration level rather than direct cross-database foreign keys.

This maintains service autonomy while preserving business-rule correctness through service APIs and transactional domain logic.

---

## 4) Deployment and Runtime Composition

### 4.1 Containerized Runtime
`docker-compose.yml` defines local multi-container orchestration for:
- gateway
- identity
- service-center
- queue
- notification
- frontend
- three dedicated MySQL containers

### 4.2 Configuration Model
Runtime configuration relies on:
- service-specific environment variables
- connection-string injection per service
- JWT settings (issuer, audience, secret source)
- service URL mapping for inter-service communication

Sensitive values are expected to be provided via secrets/environment configuration rather than hardcoded application logic.

---

## 5) Development Outcome Summary

QueueLanka Pro now has a clearly separated backend service architecture, a role-aware and real-time capable frontend, and a domain-partitioned MySQL data layer with migration and seeding support. The implementation aligns API routing, authorization, queue event broadcasting, UI integration, and operational database workflows into a coherent end-to-end platform architecture.
