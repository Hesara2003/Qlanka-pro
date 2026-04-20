# JMeter Performance Suite (SCRUM-165 to SCRUM-169)

This folder contains parameterized JMeter plans for microservices staging performance testing.

## Scenarios
- `booking-surge.jmx`: Concurrent booking traffic with login + booking loops.
- `queue-polling.jmx`: Repeated queue polling (`/api/token/my-tokens`, `/api/appointment/my-bookings`).
- `websocket-updates.jmx`: SignalR negotiate + websocket connection and center-group join.

## Runtime Configuration
Use `tests/jmeter/config/staging.properties` or override values with `-Jkey=value`.

Important properties:
- `protocol`, `host`, `port`
- `usersCsv`, `centersCountersCsv`
- `bookingThreads`, `pollingThreads`, `wsThreads`
- `bookingHoldSeconds`, `pollingHoldSeconds`, `wsHoldSeconds`

## Run Examples
From repo root:

```powershell
.tools\apache-jmeter-5.6.3\bin\jmeter.bat -n -t tests\jmeter\booking-surge.jmx -q tests\jmeter\config\staging.properties -l artifacts\perf\jmeter\booking-surge.jtl
.tools\apache-jmeter-5.6.3\bin\jmeter.bat -n -t tests\jmeter\queue-polling.jmx -q tests\jmeter\config\staging.properties -l artifacts\perf\jmeter\queue-polling.jtl
.tools\apache-jmeter-5.6.3\bin\jmeter.bat -n -t tests\jmeter\websocket-updates.jmx -q tests\jmeter\config\staging.properties -l artifacts\perf\jmeter\websocket-updates.jtl
```

## Notes
- `booking-surge.jmx` treats `200`, `409`, and `429` as acceptable booking outcomes for surge conditions.
- The websocket scenario requires SignalR endpoint reachability from the gateway (`/hubs/queue`).
- Keep credential CSVs environment-safe; defaults are test-only placeholders.
