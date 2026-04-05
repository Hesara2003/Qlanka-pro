# SCRUM-168 - Baseline Staging Execution Log

## Objective
Run JMeter scripts against staging using the prepared dataset and collect raw results.

## Target Environment
- Base URL: `https://queuelanka-api-fwhthqd4g9e0aee2.centralindia-01.azurewebsites.net`
- Branch: `test/sprint-3`
- Base source: `feature/microservices`
- Run timestamp (local): `2026-04-05 11:29:27 IST`

## Executed Scenarios
1. Booking surge (`tests/jmeter/booking-surge.jmx`)
2. Queue polling (`tests/jmeter/queue-polling.jmx`)
3. Websocket updates (`tests/jmeter/websocket-updates.jmx`)

## Execution Command Used
```powershell
.tools\apache-jmeter-5.6.3\bin\jmeter.bat -n -t tests\jmeter\booking-surge.jmx -q tests\jmeter\config\staging.properties -JbookingHoldSeconds=45 -JbookingThreads=20 -l artifacts\perf\jmeter\booking-surge-20260405-112927.jtl
.tools\apache-jmeter-5.6.3\bin\jmeter.bat -n -t tests\jmeter\queue-polling.jmx -q tests\jmeter\config\staging.properties -JpollingHoldSeconds=45 -JpollingThreads=25 -l artifacts\perf\jmeter\queue-polling-20260405-112927.jtl
.tools\apache-jmeter-5.6.3\bin\jmeter.bat -n -t tests\jmeter\websocket-updates.jmx -q tests\jmeter\config\staging.properties -JwsHoldSeconds=20 -JwsThreads=10 -l artifacts\perf\jmeter\websocket-updates-20260405-112927.jtl
```

## Raw Results
- `artifacts/perf/jmeter/booking-surge-20260405-112927.jtl`
- `artifacts/perf/jmeter/queue-polling-20260405-112927.jtl`
- `artifacts/perf/jmeter/websocket-updates-20260405-112927.jtl`
- `artifacts/perf/jmeter/summary-20260405-112927.json`

## Environment Findings
- Staging endpoint consistently returned `403 Site Disabled` for HTTP calls.
- Additional intermittent TLS handshake errors were observed (`SSLHandshakeException: Remote host terminated the handshake`).
- Because staging was unavailable, this run should be treated as **environment baseline / outage evidence**, not application performance baseline.

## Next Action
Re-run the same scripts after staging availability is restored, then compare metrics against this outage run for clean baseline validation.
