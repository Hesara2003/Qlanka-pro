#!/usr/bin/env node

/**
 * SCRUM-169 JMeter analysis utility.
 * Computes p95 latency and error rate from one or more .jtl CSV files.
 */

const fs = require('node:fs');
const path = require('node:path');

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const rank = Math.ceil((p / 100) * sorted.length) - 1;
  const idx = Math.max(0, Math.min(sorted.length - 1, rank));
  return sorted[idx];
}

function parseJtl(filePath) {
  const content = fs.readFileSync(filePath, 'utf8').trim();
  if (!content) {
    return { total: 0, errors: 0, latencies: [] };
  }

  const lines = content.split(/\r?\n/);
  const header = lines[0].split(',');
  const idxTime = header.indexOf('elapsed');
  const idxSuccess = header.indexOf('success');

  if (idxTime < 0 || idxSuccess < 0) {
    throw new Error(`${filePath}: expected CSV header with 'elapsed' and 'success'`);
  }

  const latencies = [];
  let total = 0;
  let errors = 0;

  for (let i = 1; i < lines.length; i += 1) {
    if (!lines[i]) continue;
    const cols = lines[i].split(',');
    const elapsed = Number(cols[idxTime]);
    const success = (cols[idxSuccess] || '').toLowerCase() === 'true';

    if (!Number.isFinite(elapsed)) continue;

    total += 1;
    latencies.push(elapsed);
    if (!success) errors += 1;
  }

  latencies.sort((a, b) => a - b);
  return { total, errors, latencies };
}

function summarize(files) {
  const scenarios = [];
  let grandTotal = 0;
  let grandErrors = 0;
  const grandLatencies = [];

  for (const file of files) {
    const stats = parseJtl(file);
    grandTotal += stats.total;
    grandErrors += stats.errors;
    grandLatencies.push(...stats.latencies);

    scenarios.push({
      file,
      requests: stats.total,
      errors: stats.errors,
      errorRate: stats.total ? (stats.errors / stats.total) * 100 : 0,
      p95Ms: percentile(stats.latencies, 95)
    });
  }

  grandLatencies.sort((a, b) => a - b);

  return {
    generatedAt: new Date().toISOString(),
    totalRequests: grandTotal,
    totalErrors: grandErrors,
    errorRate: grandTotal ? (grandErrors / grandTotal) * 100 : 0,
    p95Ms: percentile(grandLatencies, 95),
    scenarios
  };
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node scripts/perf/analyze-jmeter-results.js <output.json> <input1.jtl> [input2.jtl ...]');
    process.exit(1);
  }

  const outputPath = path.resolve(args[0]);
  const inputs = args.slice(1).map((p) => path.resolve(p));

  for (const input of inputs) {
    if (!fs.existsSync(input)) {
      throw new Error(`Input file not found: ${input}`);
    }
  }

  const report = summarize(inputs);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

  console.log('[SCRUM-169] Analysis complete');
  console.log(JSON.stringify(report, null, 2));
}

try {
  main();
} catch (error) {
  console.error('[SCRUM-169] Analysis failed:', error.message);
  process.exit(1);
}
