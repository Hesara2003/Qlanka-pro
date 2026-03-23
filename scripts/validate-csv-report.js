// scripts/validate-csv-report.js

const mysql = require("mysql2/promise");

const EXPECTED_HEADERS = [
  "Date",
  "Center ID",
  "Center Name",
  "Tokens Issued",
  "Served",
  "Skipped",
  "Cancelled",
  "No Shows",
  "Avg Wait Time (min)",
  "Avg Service Time (min)",
  "Peak Hour",
  "Peak Hour Tokens",
  "Active Counters",
];

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const fromDate = args.from;
  const toDate = args.to;
  const centerId = args.centerId;

  if (!fromDate || !toDate) {
    printUsageAndExit("Missing required --from and/or --to arguments.");
  }

  const apiBaseUrl = process.env.API_BASE_URL;
  const adminJwtToken = process.env.ADMIN_JWT_TOKEN;

  const dbHost = process.env.DB_HOST;
  const dbUser = process.env.DB_USER;
  const dbPassword = process.env.DB_PASSWORD;
  const dbName = process.env.DB_NAME;

  if (!apiBaseUrl || !adminJwtToken || !dbHost || !dbUser || !dbName) {
    printUsageAndExit(
      "Missing required env vars. Required: API_BASE_URL, ADMIN_JWT_TOKEN, DB_HOST, DB_USER, DB_NAME."
    );
  }

  const csvRows = await fetchCsvRows({
    apiBaseUrl,
    adminJwtToken,
    fromDate,
    toDate,
    centerId,
  });

  const dbRows = await fetchDbRows({
    dbHost,
    dbUser,
    dbPassword,
    dbName,
    fromDate,
    toDate,
    centerId,
  });

  const comparison = compareRows(csvRows, dbRows);

  console.log("\nColumn | CSV Value | DB Value | Match");
  console.log("------ | --------- | -------- | -----");
  for (const row of comparison) {
    console.log(
      `${row.column} | ${row.csvValue} | ${row.dbValue} | ${row.match ? "✅" : "❌"}`
    );
  }

  const allMatch = comparison.every((row) => row.match);
  process.exit(allMatch ? 0 : 1);
}

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--from") {
      args.from = argv[++i];
    } else if (arg === "--to") {
      args.to = argv[++i];
    } else if (arg === "--centerId") {
      args.centerId = argv[++i];
    }
  }

  return args;
}

function printUsageAndExit(message) {
  console.error(message);
  console.error(
    "Usage: node validate-csv-report.js --from 2026-01-01 --to 2026-01-31 --centerId 1"
  );
  process.exit(1);
}

async function fetchCsvRows({ apiBaseUrl, adminJwtToken, fromDate, toDate, centerId }) {
  const query = new URLSearchParams({ fromDate, toDate });
  if (centerId) {
    query.set("centerIds", centerId);
  }

  const response = await fetch(
    `${apiBaseUrl.replace(/\/$/, "")}/api/reports/daily-summary/csv?${query.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${adminJwtToken}`,
      },
    }
  );

  if (response.status === 204) {
    return [];
  }

  if (!response.ok) {
    throw new Error(`Report API request failed with status ${response.status}`);
  }

  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  if (!contentType.includes("text/csv")) {
    throw new Error(`Unexpected content-type: ${contentType}`);
  }

  const body = await response.text();
  const headers = getCsvHeaders(body);

  if (headers.join("|") !== EXPECTED_HEADERS.join("|")) {
    throw new Error("CSV headers do not match expected report format.");
  }

  const rows = parseCsvResponse(body);
  const dataRows = rows.filter((row) => row["Date"] !== "Total");

  return dataRows;
}

async function fetchDbRows({ dbHost, dbUser, dbPassword, dbName, fromDate, toDate, centerId }) {
  const conn = await mysql.createConnection({
    host: dbHost,
    user: dbUser,
    password: dbPassword || "",
    database: dbName,
    multipleStatements: false,
  });

  try {
    const params = [fromDate, toDate];
    let centerClause = "";

    if (centerId) {
      centerClause = " AND t.center_id = ?";
      params.push(Number(centerId));
    }

    const sql = `
      SELECT
        DATE(t.issued_at) AS date_value,
        t.center_id AS center_id,
        COALESCE(NULLIF((
          SELECT MIN(c.name)
          FROM counters c
          WHERE c.center_id = t.center_id
        ), ''), CONCAT('Center ', t.center_id)) AS center_name,
        COUNT(*) AS total_tokens_issued,
        SUM(CASE WHEN t.status IN ('Served', 'Completed') THEN 1 ELSE 0 END) AS served,
        SUM(CASE WHEN t.status = 'Skipped' THEN 1 ELSE 0 END) AS skipped,
        SUM(CASE WHEN t.status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelled,
        SUM(CASE WHEN t.status IN ('Waiting', 'Called') THEN 1 ELSE 0 END) AS no_shows,
        COALESCE(ROUND(AVG(CASE
          WHEN t.called_at IS NOT NULL THEN TIMESTAMPDIFF(SECOND, t.issued_at, t.called_at)
          ELSE NULL
        END)), 0) AS avg_wait_seconds,
        COALESCE(ROUND(AVG(CASE
          WHEN t.called_at IS NOT NULL AND t.served_at IS NOT NULL THEN TIMESTAMPDIFF(SECOND, t.called_at, t.served_at)
          ELSE NULL
        END)), 0) AS avg_service_seconds,
        COALESCE((
          SELECT HOUR(tp.issued_at)
          FROM tokens tp
          WHERE DATE(tp.issued_at) = DATE(t.issued_at)
            AND tp.center_id = t.center_id
          GROUP BY HOUR(tp.issued_at)
          ORDER BY COUNT(*) DESC, HOUR(tp.issued_at) ASC
          LIMIT 1
        ), 0) AS peak_hour,
        COALESCE((
          SELECT COUNT(*)
          FROM tokens tp
          WHERE DATE(tp.issued_at) = DATE(t.issued_at)
            AND tp.center_id = t.center_id
          GROUP BY HOUR(tp.issued_at)
          ORDER BY COUNT(*) DESC, HOUR(tp.issued_at) ASC
          LIMIT 1
        ), 0) AS peak_hour_tokens,
        COUNT(DISTINCT CASE
          WHEN t.counter_id IS NOT NULL AND t.status IN ('Served', 'Completed') THEN t.counter_id
          ELSE NULL
        END) AS active_counters
      FROM tokens t
      WHERE DATE(t.issued_at) BETWEEN ? AND ?
      ${centerClause}
      GROUP BY DATE(t.issued_at), t.center_id
      ORDER BY date_value ASC, center_name ASC
    `;

    const [rows] = await conn.query(sql, params);

    return rows.map((row) => ({
      Date: formatDate(row.date_value),
      "Center ID": String(row.center_id),
      "Center Name": String(row.center_name),
      "Tokens Issued": String(row.total_tokens_issued),
      Served: String(row.served),
      Skipped: String(row.skipped),
      Cancelled: String(row.cancelled),
      "No Shows": String(row.no_shows),
      "Avg Wait Time (min)": formatMinutes(row.avg_wait_seconds),
      "Avg Service Time (min)": formatMinutes(row.avg_service_seconds),
      "Peak Hour": `${String(row.peak_hour).padStart(2, "0")}:00`,
      "Peak Hour Tokens": String(row.peak_hour_tokens),
      "Active Counters": String(row.active_counters),
    }));
  } finally {
    await conn.end();
  }
}

function compareRows(csvRows, dbRows) {
  const fieldsToCompare = [...EXPECTED_HEADERS];
  const comparison = [];

  const csvMap = new Map(csvRows.map((row) => [`${row["Date"]}|${row["Center ID"]}`, row]));
  const dbMap = new Map(dbRows.map((row) => [`${row["Date"]}|${row["Center ID"]}`, row]));

  const keys = new Set([...csvMap.keys(), ...dbMap.keys()]);

  for (const key of keys) {
    const csv = csvMap.get(key) || {};
    const db = dbMap.get(key) || {};

    for (const field of fieldsToCompare) {
      const csvValue = String(csv[field] ?? "<missing>");
      const dbValue = String(db[field] ?? "<missing>");
      comparison.push({
        column: `${key} :: ${field}`,
        csvValue,
        dbValue,
        match: csvValue === dbValue,
      });
    }
  }

  return comparison;
}

function stripBom(text) {
  if (!text) {
    return text;
  }

  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function getCsvHeaders(responseBody) {
  const parsed = parseCsvBody(responseBody);
  return parsed.length > 0 ? parsed[0] : [];
}

function parseCsvResponse(responseBody) {
  const parsed = parseCsvBody(responseBody);
  if (parsed.length === 0) {
    return [];
  }

  const headers = parsed[0];
  const rows = parsed.slice(1);

  return rows
    .filter((row) => !(row.length === 1 && row[0].trim() === ""))
    .map((row) => {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = row[index] ?? "";
      });
      return record;
    });
}

function parseCsvBody(responseBody) {
  const text = stripBom(responseBody);
  const rows = [];
  let currentRow = [];
  let currentField = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];

    if (inQuotes) {
      if (char === '"') {
        if (index + 1 < text.length && text[index + 1] === '"') {
          currentField += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      currentRow.push(currentField);
      currentField = "";
      continue;
    }

    if (char === "\r") {
      continue;
    }

    if (char === "\n") {
      currentRow.push(currentField);
      currentField = "";
      rows.push(currentRow);
      currentRow = [];
      continue;
    }

    currentField += char;
  }

  if (inQuotes) {
    throw new Error("Invalid CSV format: unmatched quote");
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

function formatMinutes(seconds) {
  return (Number(seconds) / 60).toFixed(1);
}

function formatDate(value) {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
}

main().catch((error) => {
  console.error(`Validation failed: ${error.message}`);
  process.exit(1);
});
