# SCRUM-169 - Performance Report (p95 and Error Rate)

## Objective
Analyze JMeter raw outputs and summarize key performance metrics.

## Metrics Required
- p95 latency (ms)
- error rate (%)

## Data Sources
- `artifacts/perf/jmeter/booking-surge-20260405-112927.jtl`
- `artifacts/perf/jmeter/queue-polling-20260405-112927.jtl`
- `artifacts/perf/jmeter/websocket-updates-20260405-112927.jtl`

## Analysis Tool
- `scripts/perf/analyze-jmeter-results.js`
- Output: `artifacts/perf/jmeter/summary-20260405-112927.json`

## Extracted Metrics
### Booking surge
- Requests: `312`
- p95 latency: `435 ms`
- Error rate: `100%`

### Queue polling
- Requests: `125`
- p95 latency: `561 ms`
- Error rate: `100%`

### Websocket updates
- Requests: `24`
- p95 latency: `2793 ms`
- Error rate: `100%`

### Aggregate
- Total requests: `461`
- Aggregate p95 latency: `547 ms`
- Aggregate error rate: `100%`

## Observations
1. Results are dominated by staging infrastructure failure (`403 Site Disabled`) rather than business endpoint behavior.
2. SSL handshake terminations were also present, indicating transient transport instability while service was unavailable.
3. Websocket scenario shows worst p95 due connection failures and retries under disabled endpoint conditions.

## Conclusion
SCRUM-169 metrics extraction is complete and reproducible, but the current metrics represent **staging outage characteristics** and are not valid for product performance capacity assessment. Re-run SCRUM-168 after staging recovery to establish an application baseline.
