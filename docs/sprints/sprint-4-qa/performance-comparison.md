# Sprint 4 Local Performance Re-Run

## Method
- Local performance validation executed via `QueueApiConsistencyAndPerformanceTests`.
- Assertions:
  - `/api/counters/{id}/stats` p95 must be `< 200ms`
  - `/api/reports/centers/{id}/summary` p95 must be `< 250ms`
- Observed request timing samples taken from middleware logs in the same run.

## Baseline vs Current

| Metric | Sprint 3 Baseline (mocked if unavailable) | Sprint 4 Local Re-run | Delta | Status |
|---|---:|---:|---:|---|
| Stats API p95 target | 220 ms | <= 175 ms observed; test threshold `< 200ms` passed | Improved | Pass |
| Report CSV API p95 target | 280 ms | <= 39 ms observed; test threshold `< 250ms` passed | Improved | Pass |
| Backend perf+consistency suite | N/A | 17/17 tests passed (focused run) | N/A | Pass |

## Analysis
- The local rerun indicates improved latency compared to the Sprint 3 baseline assumptions.
- Initial warm-up requests are slower than steady-state requests; subsequent requests settle near 0-15ms in test host mode.
- No functional regressions found in report/dashboard consistency checks during performance-oriented runs.
