# QueueLanka Local Observability Guide

This guide explains how to run, use, and troubleshoot Grafana + Prometheus locally (without Docker) for QueueLanka.

## 1) What This Setup Gives You

- Local backend services with metrics exposed at /metrics
- Local Prometheus scraping those metrics
- Local Grafana dashboards and queries for visualization
- Scripts to start, stop, generate traffic, and run load tests

## 2) Architecture (Local)

- Gateway: http://localhost:5012
- Identity: http://localhost:5177
- Service Center: http://localhost:5137
- Queue: http://localhost:5239
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000

Prometheus scrape config for local:
- deploy/infrastructure/monitoring/prometheus/prometheus.local.yml

Grafana dashboard JSON:
- deploy/infrastructure/monitoring/grafana/dashboards/key-metrics-dashboard.json

## 3) Required Prerequisites

- .NET 8 SDK
- Node.js 18+ (Node 20 recommended)
- Grafana installed on Windows and running
- Prometheus Windows binary (prometheus.exe)

## 4) Scripts You Need

### 4.1 Start full local observability stack

Script:
- scripts/start-local-observability-stack.ps1

Starts:
- identity (5177)
- service-center (5137)
- queue (5239)
- gateway (5012)
- prometheus (9090)

Command (example):

  ./scripts/start-local-observability-stack.ps1 -PrometheusExe "C:\Users\Dell\Downloads\prometheus-3.11.0.windows-amd64\prometheus-3.11.0.windows-amd64\prometheus.exe"

Options:
- -SkipPrometheus (start backend services only)
- -NoBrowser (do not auto-open Prometheus targets page)

### 4.2 Stop full local observability stack

Script:
- scripts/stop-local-observability-stack.ps1

Command:

  ./scripts/stop-local-observability-stack.ps1

### 4.3 Start only Prometheus

Script:
- scripts/start-observability-local.ps1

Command:

  ./scripts/start-observability-local.ps1 -PrometheusExe "C:\path\to\prometheus.exe"

### 4.4 Run quick local load test

Script:
- scripts/load_test_local.js

NPM aliases in package.json:
- load:test:gateway
- load:test:queue
- load:test:gateway-auth

Commands:

  npm run load:test:gateway
  npm run load:test:queue
  npm run load:test:gateway-auth

Custom command examples:

  node scripts/load_test_local.js --url http://localhost:5012/health --duration 30 --concurrency 50
  node scripts/load_test_local.js --url http://localhost:5012/api/auth/login --method POST --header Content-Type:application/json --body {"email":"fake@example.com","password":"wrong"} --duration 20 --concurrency 20

## 5) Bring Up the Stack (Recommended Sequence)

1. Ensure Grafana service is running
2. Start local stack script with Prometheus path
3. Confirm health endpoints
4. Open Prometheus targets
5. Open Grafana and set datasource
6. Import dashboard JSON

Health checks:

- Gateway health: http://localhost:5012/health
- Prometheus healthy: http://localhost:9090/-/healthy
- Prometheus targets: http://localhost:9090/targets
- Grafana health API: http://localhost:3000/api/health

## 6) Configure Grafana

1. Open Grafana: http://localhost:3000
2. Add datasource:
   - Type: Prometheus
   - URL: http://localhost:9090
3. Import dashboard:
   - File: deploy/infrastructure/monitoring/grafana/dashboards/key-metrics-dashboard.json
4. Set dashboard refresh to 5s or 10s for dynamic visuals

## 7) How to Work With Prometheus (Query Basics)

Open Prometheus expression browser:
- http://localhost:9090/graph

Useful starter queries:

- up
- up{job=~"gateway|identity|service-center|queue|prometheus"}
- sum by (job) (rate(http_requests_received_total[5m]))
- sum by (job, code) (rate(http_requests_received_total{code=~"2..|3..|4..|5.."}[5m]))
- histogram_quantile(0.95, sum by (le, job) (rate(http_request_duration_seconds_bucket[5m])))

## 8) Dashboard Panels Included

Current dashboard includes:

- API Latency (P95)
- API Error Rate (5xx)
- Queue Size (with fallback)
- Target Availability
- Request Throughput
- HTTP Status Distribution
- Average Response Time
- In-Flight Requests
- Response Code Donut (5m)
- Service Availability Ring

## 9) Generate Traffic for Visible Charts

If charts look flat or sparse, generate traffic:

- Run load test scripts from section 4.4
- Or repeatedly open health and API routes through gateway

Tip:
- Keep dashboard time range at Last 15 minutes while testing

## 10) Common Issues and Fixes

### 10.1 Prometheus executable not found

Cause:
- Wrong path or wrong OS build

Fix:
- Use Windows build (windows-amd64) and point to prometheus.exe

### 10.2 Grafana login issues

Try default admin/admin first.
If needed, reset password using elevated PowerShell with homepath set.

### 10.3 Dashboard does not save

Typical causes:
- Existing dashboard UID conflict
- Permission role too low
- Provisioned/read-only dashboard source

Quick fix:
- Use Save As with a new title and new UID if prompted

### 10.4 No data in specific panels

Cause:
- No traffic in selected time range
- Metric labels differ
- Service not running

Fix:
- Check Prometheus targets page
- Test query directly in Explore
- Generate traffic

## 11) Observability Logs

Local stack logs are stored in:
- logs/observability

You will find per-process stdout/stderr logs for:
- identity
- service-center
- queue
- gateway
- prometheus

## 12) Extended Load Testing (WebSocket/SignalR)

For concurrent SignalR scenario testing, use:
- docs/sprints/websocket-load-test-plan.md

It includes:
- 50-client baseline plan
- pass/fail criteria
- scaling guidance to 100/250/500 clients

## 13) Recommended Daily Workflow

1. Start stack script
2. Confirm targets are UP in Prometheus
3. Open Grafana dashboard
4. Run one short load test
5. Observe latency, throughput, status mix, availability
6. Stop stack script when done

## 14) File Index

Core config and docs:
- deploy/infrastructure/monitoring/prometheus/prometheus.local.yml
- deploy/infrastructure/monitoring/grafana/dashboards/key-metrics-dashboard.json
- docs/observability-grafana-prometheus-local-guide.md

Scripts:
- scripts/start-local-observability-stack.ps1
- scripts/stop-local-observability-stack.ps1
- scripts/start-observability-local.ps1
- scripts/load_test_local.js

NPM entry points:
- package.json
