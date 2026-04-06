# Dashboard Setup and Usage Guide

This guide explains how to access the monitoring dashboard, understand key metrics, and use logs for troubleshooting in the Qlanka-pro repository.

## 1. Dashboard Access

QueueLanka supports both Docker-based and local Windows observability setups.

Dashboard URLs:

- Docker Grafana URL: http://localhost:3001
- Local Windows Grafana URL: http://localhost:3000

Default Grafana credentials (Docker setup):

- Username: admin
- Password: admin

Data source and dashboard files in repository:

- Dashboard JSON: deploy/infrastructure/monitoring/grafana/dashboards/key-metrics-dashboard.json
- Docker datasource provisioning: deploy/infrastructure/monitoring/grafana/provisioning/datasources/prometheus.yml
- Dashboard provisioning: deploy/infrastructure/monitoring/grafana/provisioning/dashboards/dashboard-provider.yml
- Local Prometheus config: deploy/infrastructure/monitoring/prometheus/prometheus.local.yml

## 2. Quick Setup

### Option A: Docker stack

From repository root:

```bash
docker compose up -d
```

Then open:

- Grafana: http://localhost:3001
- Prometheus targets: http://localhost:9090/targets

### Option B: Local Windows stack (without Docker)

1. Start local stack:

```powershell
./scripts/start-local-observability-stack.ps1 -PrometheusExe C:\tools\prometheus\prometheus.exe
```

2. Confirm services:

- Gateway health: http://localhost:5012/health
- Prometheus healthy: http://localhost:9090/-/healthy
- Prometheus targets: http://localhost:9090/targets
- Grafana health: http://localhost:3000/api/health

3. In Grafana, add data source if required:

- Type: Prometheus
- URL: http://localhost:9090

4. Import dashboard JSON if not auto-provisioned:

- deploy/infrastructure/monitoring/grafana/dashboards/key-metrics-dashboard.json

## 3. Dashboard Panels and How to Interpret Them

The default dashboard title is QueueLanka Key Metrics and includes the following core panels.

### API Latency (P95)

- What it means: 95th percentile response time by service over the last 5 minutes.
- Query type: histogram_quantile over request duration buckets.
- How to read it:
  - Green zone: healthy latency.
  - Orange and red zones: degraded response times.
- Typical action:
  - If only one service is high, inspect that service logs and downstream dependencies first.

### API Error Rate (5xx)

- What it means: percentage of server errors among all responses.
- Thresholds in dashboard:
  - Green: below 1%
  - Orange: >= 1%
  - Red: >= 5%
- Typical action:
  - Correlate spikes with deployment or traffic bursts.
  - Check gateway and affected service error logs.

### Queue Size

- What it means: queue depth indicator for queue service (uses fallback metrics if primary queue metric is unavailable).
- Thresholds in dashboard:
  - Green: normal
  - Orange: >= 50
  - Red: >= 100
- Typical action:
  - If queue size rises with low throughput, check queue processing and counter operations.

### Target Availability

- What it means: Prometheus scrape status for gateway, identity, service-center, queue, and notification.
- Value mapping:
  - 1 = Up
  - 0 = Down
- Typical action:
  - If a target is Down, confirm service process/container health and /metrics endpoint reachability.

### Request Throughput and HTTP Status Distribution

- Request Throughput: requests per second by service.
- HTTP Status Distribution: status code mix (2xx, 3xx, 4xx, 5xx) over time.
- Typical action:
  - Rising throughput with stable latency is healthy scaling.
  - Rising 4xx often indicates client or auth issues.
  - Rising 5xx indicates server-side instability.

### Average Response Time and In-Flight Requests

- Average Response Time: mean response duration by service.
- In-Flight Requests: concurrent in-progress requests.
- Typical action:
  - Increasing in-flight requests plus higher latency usually indicates saturation.

### Response Code Donut (5m) and Service Availability Ring

- Response Code Donut: code share in last 5 minutes for quick visual ratio checks.
- Service Availability Ring: overall availability score.
- Thresholds in availability ring:
  - Red: below 75%
  - Orange: 75%-99%
  - Green: >= 99%

## 4. Log-Based Troubleshooting Workflow

Log directory:

- logs/observability

What you will find:

- Per-process stdout logs: *.out.log
- Per-process stderr logs: *.err.log
- Process tracking file for local stack: logs/observability/processes.json

Typical files include:

- gateway-<timestamp>.out.log
- gateway-<timestamp>.err.log
- identity-<timestamp>.out.log
- queue-<timestamp>.err.log
- service-center-<timestamp>.err.log
- prometheus-<timestamp>.err.log

Troubleshooting sequence:

1. Detect issue on dashboard (for example latency spike or target down).
2. Narrow to affected service from panel labels (job name).
3. Check corresponding stderr log first for exceptions.
4. Check stdout log for warnings, restarts, and startup configuration messages.
5. Verify target status in Prometheus targets page.
6. Reproduce with controlled load using scripts/load_test_local.js if needed.
7. Confirm recovery on dashboard after fix.

Useful quick checks:

- Prometheus targets: http://localhost:9090/targets
- Prometheus query UI: http://localhost:9090/graph

## 5. Recommended Usage Pattern

For day-to-day monitoring:

1. Set dashboard time range to Last 15 minutes during active testing.
2. Use 5s to 10s refresh for near-real-time behavior.
3. Watch these in combination, not isolation:
   - API Latency (P95)
   - API Error Rate (5xx)
   - Request Throughput
   - In-Flight Requests
4. Validate against logs before escalating incidents.

## 6. Maintenance Notes

When updating dashboard behavior:

1. Edit dashboard JSON:
   - deploy/infrastructure/monitoring/grafana/dashboards/key-metrics-dashboard.json
2. Keep thresholds aligned with service SLO expectations.
3. Verify panel queries against actual metric names exposed by services.
4. Test both Docker and local Windows paths when changing setup instructions.
5. Update this guide when URLs, ports, panel names, or log paths change.

## 7. Related Documentation

- docs/observability-grafana-prometheus-local-guide.md
- README.md
