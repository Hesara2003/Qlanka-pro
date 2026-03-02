const fs = require('fs');
function adaptSql(sql) {
  return sql
    .replace(/CREATE DATABASE IF NOT EXISTS queuelanka[\s\S]*?;/i, '')
    .replace(/USE queuelanka;/gi, '')
    .replace(/ADD COLUMN IF NOT EXISTS/gi, 'ADD COLUMN')
    .replace(/ADD CONSTRAINT IF NOT EXISTS/gi, 'ADD CONSTRAINT')
    .replace(/CREATE INDEX IF NOT EXISTS/gi, 'CREATE INDEX');
}
function splitStatements(sql) {
  const stmts = [];
  let current = '';
  let inSingle = false, inDouble = false, inLineComment = false, inBlockComment = false;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i]; const next = sql[i + 1] || '';
    if (inLineComment) { current += ch; if (ch === '\n') inLineComment = false; continue; }
    if (inBlockComment) { current += ch; if (ch === '*' && next === '/') { current += next; i++; inBlockComment = false; } continue; }
    if (!inSingle && !inDouble && ch === '-' && next === '-') { inLineComment = true; current += ch; continue; }
    if (!inSingle && !inDouble && ch === '/' && next === '*') { inBlockComment = true; current += ch; continue; }
    if (ch === "'" && !inDouble) { inSingle = !inSingle; current += ch; continue; }
    if (ch === '"' && !inSingle) { inDouble = !inDouble; current += ch; continue; }
    if (ch === ';' && !inSingle && !inDouble) { const stmt = current.trim(); if (stmt) stmts.push(stmt); current = ''; continue; }
    current += ch;
  }
  const last = current.trim(); if (last) stmts.push(last);
  return stmts;
}
const path = require('path');
const raw = fs.readFileSync(path.join(__dirname, '..', 'backend', 'QueueLanka.API', 'Database', 'Migrations', '003_service_center_availability.sql'), 'utf8');
const sql = adaptSql(raw);
const stmts = splitStatements(sql);
console.log(`Total statements: ${stmts.length}\n`);
stmts.forEach((s, i) => {
  const lines = s.trim().split('\n');
  const first = lines[0].trim().substring(0, 60);
  const last = lines[lines.length - 1].trim().substring(0, 60);
  console.log(`[${i + 1}] (${lines.length} lines)`);
  console.log(`     START: ${first}`);
  console.log(`     END:   ${last}\n`);
});
