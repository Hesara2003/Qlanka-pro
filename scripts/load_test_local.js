#!/usr/bin/env node

const { performance } = require('perf_hooks');

function parseArgs(argv) {
  const args = {
    url: 'http://localhost:5012/health',
    durationSec: 20,
    concurrency: 30,
    timeoutMs: 5000,
    method: 'GET',
    body: null,
    header: []
  };

  for (let i = 2; i < argv.length; i += 1) {
    const key = argv[i];
    const next = argv[i + 1];
    if (!next) continue;

    if (key === '--url') {
      args.url = next;
      i += 1;
    } else if (key === '--duration') {
      args.durationSec = Number(next);
      i += 1;
    } else if (key === '--concurrency') {
      args.concurrency = Number(next);
      i += 1;
    } else if (key === '--timeout') {
      args.timeoutMs = Number(next);
      i += 1;
    } else if (key === '--method') {
      args.method = next.toUpperCase();
      i += 1;
    } else if (key === '--body') {
      args.body = next;
      i += 1;
    } else if (key === '--header') {
      args.header.push(next);
      i += 1;
    }
  }

  return args;
}

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

async function main() {
  const cfg = parseArgs(process.argv);
  const stopAt = Date.now() + cfg.durationSec * 1000;
  const latencies = [];
  const counters = {
    total: 0,
    success: 0,
    failed: 0,
    timeout: 0,
    status2xx: 0,
    status4xx: 0,
    status5xx: 0
  };

  const headers = {};
  for (const h of cfg.header) {
    const sep = h.indexOf(':');
    if (sep > 0) {
      const k = h.slice(0, sep).trim();
      const v = h.slice(sep + 1).trim();
      headers[k] = v;
    }
  }

  const worker = async () => {
    while (Date.now() < stopAt) {
      const start = performance.now();
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), cfg.timeoutMs);

      try {
        const res = await fetch(cfg.url, {
          method: cfg.method,
          headers,
          body: cfg.body,
          signal: ac.signal
        });
        await res.arrayBuffer();

        counters.total += 1;
        counters.success += 1;
        if (res.status >= 200 && res.status < 300) counters.status2xx += 1;
        else if (res.status >= 400 && res.status < 500) counters.status4xx += 1;
        else if (res.status >= 500) counters.status5xx += 1;

        latencies.push(performance.now() - start);
      } catch (err) {
        counters.total += 1;
        counters.failed += 1;
        if (err && err.name === 'AbortError') counters.timeout += 1;
      } finally {
        clearTimeout(timer);
      }
    }
  };

  console.log('Load test started');
  console.log(JSON.stringify({
    url: cfg.url,
    method: cfg.method,
    durationSec: cfg.durationSec,
    concurrency: cfg.concurrency,
    timeoutMs: cfg.timeoutMs
  }, null, 2));

  const started = performance.now();
  await Promise.all(Array.from({ length: cfg.concurrency }, () => worker()));
  const elapsedSec = (performance.now() - started) / 1000;

  latencies.sort((a, b) => a - b);
  const avg = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;

  const summary = {
    elapsedSec: Number(elapsedSec.toFixed(2)),
    totalRequests: counters.total,
    success: counters.success,
    failed: counters.failed,
    timeouts: counters.timeout,
    rps: Number((counters.total / elapsedSec).toFixed(2)),
    latencyMs: {
      avg: Number(avg.toFixed(2)),
      p50: Number(percentile(latencies, 50).toFixed(2)),
      p95: Number(percentile(latencies, 95).toFixed(2)),
      p99: Number(percentile(latencies, 99).toFixed(2))
    },
    statusBreakdown: {
      s2xx: counters.status2xx,
      s4xx: counters.status4xx,
      s5xx: counters.status5xx
    }
  };

  console.log('Load test completed');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error('Load test failed', err);
  process.exit(1);
});
