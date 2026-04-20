# SCRUM-166 - Parameterized JMeter Scripts

## Deliverables
- `tests/jmeter/booking-surge.jmx`
- `tests/jmeter/queue-polling.jmx`
- `tests/jmeter/websocket-updates.jmx`
- `tests/jmeter/config/staging.properties`
- `tests/jmeter/config/users.csv`
- `tests/jmeter/config/centers-counters.csv`

## Parameterization Strategy
All scenario-specific values are externalized:
- Host/protocol/port via property file
- Thread/ramp/hold profiles via property file
- Credentials and center/counter IDs via CSV files

This allows repeatability across local and staging with no JMX structural edits.

## Staging Execution
```powershell
.tools\apache-jmeter-5.6.3\bin\jmeter.bat -n -t tests\jmeter\booking-surge.jmx -q tests\jmeter\config\staging.properties -l artifacts\perf\jmeter\booking-surge.jtl
.tools\apache-jmeter-5.6.3\bin\jmeter.bat -n -t tests\jmeter\queue-polling.jmx -q tests\jmeter\config\staging.properties -l artifacts\perf\jmeter\queue-polling.jtl
.tools\apache-jmeter-5.6.3\bin\jmeter.bat -n -t tests\jmeter\websocket-updates.jmx -q tests\jmeter\config\staging.properties -l artifacts\perf\jmeter\websocket-updates.jtl
```

## Repeatability Controls
- Stable CSV ordering with deterministic test users.
- Property file committed in repo for baseline profile.
- Run metadata captured in SCRUM-168 log.
