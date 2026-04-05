# SCRUM-167 - Performance Dataset Specification

## Objective
Provide a consistent dataset for repeatable performance runs across booking, polling, and websocket scenarios.

## Dataset Components
1. Users (`tests/jmeter/config/users.csv`)
- `healthcheck_citizen` for booking and polling traffic.
- `healthcheck_officer` reserved for counter/event trigger flows.

2. Center/Counter matrix (`tests/jmeter/config/centers-counters.csv`)
- Fixed center and counter IDs.
- Fixed appointment date/time slots for deterministic booking payloads.

3. Seed scripts
- `scripts/perf/seed-performance-dataset.js`
- `scripts/perf/reset-performance-dataset.js`

## Coverage Mapping
- Booking surge: uses center/date/time combinations to generate booking pressure.
- Queue polling: uses authenticated user token/appointment polling endpoints.
- Websocket updates: uses center IDs for group join and event subscription scope.

## Repeatability Rules
- Run `seed-performance-dataset.js` before each baseline test run.
- Run `reset-performance-dataset.js` after test completion.
- Keep CSV schema stable; add columns only with backward-compatible defaults.
