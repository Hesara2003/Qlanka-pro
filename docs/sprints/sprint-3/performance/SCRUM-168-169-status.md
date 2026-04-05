# SCRUM-168 and SCRUM-169 Execution Status

- Run timestamp: `2026-04-05 11:29:27 IST`
- Git SHA at run time: `a73da9f` (base branch tip)
- Branch: `test/sprint-3`

## JTL files
- `artifacts/perf/jmeter/booking-surge-20260405-112927.jtl`
- `artifacts/perf/jmeter/queue-polling-20260405-112927.jtl`
- `artifacts/perf/jmeter/websocket-updates-20260405-112927.jtl`

## Metrics
- Booking surge p95: `435 ms`, error rate: `100%`
- Queue polling p95: `561 ms`, error rate: `100%`
- Websocket updates p95: `2793 ms`, error rate: `100%`
- Aggregate p95: `547 ms`, aggregate error rate: `100%`

## Status
SCRUM-168 execution: **completed with raw artifacts**
SCRUM-169 analysis/reporting: **completed with extracted metrics**

## Environment note
Staging returned `403 Site Disabled` and intermittent SSL handshake failures during run window. Re-run required for production-like baseline once environment is active.
