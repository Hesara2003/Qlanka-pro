const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mysql = require('mysql2/promise');

const ROOT = path.resolve(__dirname, '..');

const DB_HOST = process.env.DB_HOST || 'identity-db.mysql.database.azure.com';
const DB_PORT = Number(process.env.DB_PORT || '3306');
const DB_USER = process.env.DB_USER || 'admin_identity';
const DB_PASSWORD = process.env.DB_PASSWORD;

if (!DB_PASSWORD) {
  console.error('DB_PASSWORD is required.');
  process.exit(1);
}

const baseConfig = {
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false,
  },
  multipleStatements: false,
};

const migrationPlans = [
  {
    service: 'identity',
    database: 'identity',
    files: [
      path.join(ROOT, 'backend', 'QueueLanka.Identity', 'Database', 'Migrations', '001_identity_schema.sql'),
    ],
  },
  {
    service: 'queue',
    database: 'queue',
    preSql: [
      `CREATE TABLE IF NOT EXISTS users (
          user_id INT PRIMARY KEY,
          username VARCHAR(50) NOT NULL UNIQUE,
          email VARCHAR(100) NOT NULL UNIQUE,
          password_hash VARCHAR(255) NOT NULL,
          role ENUM('citizen', 'officer', 'admin') NOT NULL DEFAULT 'citizen',
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          is_email_verified BOOLEAN NOT NULL DEFAULT TRUE,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
    ],
    files: [
      path.join(ROOT, 'backend', 'QueueLanka.Queue', 'Database', 'Migrations', '001_queue_schema.sql'),
      path.join(ROOT, 'backend', 'QueueLanka.Queue', 'Database', 'Migrations', '002_counter_schema.sql'),
      path.join(ROOT, 'backend', 'QueueLanka.Queue', 'Database', 'Migrations', '003_token_called_status.sql'),
      path.join(ROOT, 'backend', 'QueueLanka.Queue', 'Database', 'Migrations', '004_token_status_queue_management.sql'),
      path.join(ROOT, 'backend', 'QueueLanka.Queue', 'Database', 'Migrations', '005_audit_logs.sql'),
      path.join(ROOT, 'backend', 'QueueLanka.Queue', 'Database', 'Migrations', '006_token_reassignment_audit_schema.sql'),
      path.join(ROOT, 'backend', 'QueueLanka.Queue', 'Database', 'Migrations', '007_counter_management_schema.sql'),
    ],
  },
  {
    service: 'service-centre',
    database: 'service-centre',
    files: [
      path.join(ROOT, 'backend', 'QueueLanka.ServiceCenter', 'Database', 'Migrations', '001_servicecenter_schema.sql'),
    ],
  },
];

function parseSqlStatements(rawSql) {
  const sql = rawSql.replace(/^\uFEFF/, '');
  const lines = sql.split(/\r?\n/);

  let delimiter = ';';
  let current = '';
  const statements = [];

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '');
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    if (/^--/.test(trimmed)) {
      continue;
    }

    const delimiterMatch = trimmed.match(/^DELIMITER\s+(.+)$/i);
    if (delimiterMatch) {
      delimiter = delimiterMatch[1].trim();
      continue;
    }

    current += line + '\n';

    if (trimmed.endsWith(delimiter)) {
      let statement = current.trim();
      current = '';

      const delimiterIndex = statement.lastIndexOf(delimiter);
      if (delimiterIndex >= 0) {
        statement = statement.slice(0, delimiterIndex).trim();
      }

      if (statement) {
        statements.push(statement);
      }
    }
  }

  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements;
}

function checksum(content) {
  return crypto.createHash('sha256').update(content, 'utf8').digest('hex');
}

async function ensureDatabaseExists(connection, databaseName) {
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
}

async function ensureMigrationTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS __schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      migration_name VARCHAR(255) NOT NULL UNIQUE,
      checksum CHAR(64) NOT NULL,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function isMigrationApplied(connection, migrationName) {
  const [rows] = await connection.query(
    'SELECT 1 FROM __schema_migrations WHERE migration_name = ? LIMIT 1',
    [migrationName],
  );
  return rows.length > 0;
}

async function markMigrationApplied(connection, migrationName, migrationChecksum) {
  await connection.query(
    'INSERT INTO __schema_migrations (migration_name, checksum) VALUES (?, ?)',
    [migrationName, migrationChecksum],
  );
}

function splitTopLevelCommaClauses(input) {
  const parts = [];
  let current = '';
  let depth = 0;
  let quote = null;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    const prev = i > 0 ? input[i - 1] : '';

    if (quote) {
      current += ch;
      if (ch === quote && prev !== '\\') {
        quote = null;
      }
      continue;
    }

    if (ch === '\'' || ch === '"' || ch === '`') {
      quote = ch;
      current += ch;
      continue;
    }

    if (ch === '(') {
      depth += 1;
      current += ch;
      continue;
    }

    if (ch === ')') {
      depth = Math.max(0, depth - 1);
      current += ch;
      continue;
    }

    if (ch === ',' && depth === 0) {
      if (current.trim()) {
        parts.push(current.trim());
      }
      current = '';
      continue;
    }

    current += ch;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

async function runAlterTableAddColumnCompat(connection, statement, migrationName, statementIndex, totalStatements) {
  const normalized = statement.trim().replace(/;\s*$/, '');
  const alterMatch = normalized.match(/^ALTER\s+TABLE\s+`?([^`\s]+)`?\s+([\s\S]+)$/i);

  if (!alterMatch) {
    await connection.query(statement);
    return;
  }

  const tableName = alterMatch[1];
  const clauseText = alterMatch[2];
  const clauses = splitTopLevelCommaClauses(clauseText);

  for (const clause of clauses) {
    const addColumnMatch = clause.match(/^ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS\s+`?([^`\s]+)`?\s+([\s\S]+)$/i);

    if (!addColumnMatch) {
      const passthroughSql = `ALTER TABLE \`${tableName}\` ${clause}`;
      await connection.query(passthroughSql);
      continue;
    }

    const columnName = addColumnMatch[1];
    const definition = addColumnMatch[2].trim();
    const [existsRows] = await connection.query(
      `SELECT 1
       FROM information_schema.columns
       WHERE table_schema = DATABASE()
         AND table_name = ?
         AND column_name = ?
       LIMIT 1`,
      [tableName, columnName],
    );

    if (existsRows.length > 0) {
      console.log(
        `[WARN] ${migrationName} statement ${statementIndex + 1}/${totalStatements} skipped existing column ${tableName}.${columnName}`,
      );
      continue;
    }

    const addSql = `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`;
    await connection.query(addSql);
  }
}

function normalizeForServerCompatibility(statement) {
  return statement
    .replace(/DEFAULT\s+UTC_TIMESTAMP\(\)/gi, 'DEFAULT CURRENT_TIMESTAMP')
    .replace(/ON\s+UPDATE\s+UTC_TIMESTAMP\(\)/gi, 'ON UPDATE CURRENT_TIMESTAMP');
}

async function executeStatements(connection, statements, migrationName) {
  const ignorableErrnos = new Set([
    1050, // ER_TABLE_EXISTS_ERROR
    1060, // ER_DUP_FIELDNAME
    1061, // ER_DUP_KEYNAME
    1091, // ER_CANT_DROP_FIELD_OR_KEY
    1304, // ER_SP_ALREADY_EXISTS
    1359, // ER_TRG_ALREADY_EXISTS
    1826, // ER_FK_DUP_NAME
  ]);

  const ignorableMessages = [
    'already exists',
    'duplicate key name',
    'duplicate column name',
    'duplicate foreign key',
  ];

  const isIgnorableError = (error) => {
    if (error && ignorableErrnos.has(error.errno)) {
      return true;
    }

    const message = (error && error.message ? error.message : '').toLowerCase();
    return ignorableMessages.some((snippet) => message.includes(snippet));
  };

  for (let index = 0; index < statements.length; index += 1) {
    const statement = normalizeForServerCompatibility(statements[index]);

    try {
      if (/ALTER\s+TABLE[\s\S]+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS/i.test(statement)) {
        await runAlterTableAddColumnCompat(connection, statement, migrationName, index, statements.length);
        continue;
      }

      await connection.query(statement);
    } catch (error) {
      if (isIgnorableError(error)) {
        console.log(`[WARN] ${migrationName} statement ${index + 1}/${statements.length} ignored: ${error.message}`);
        continue;
      }

      console.error(`\n[ERROR] ${migrationName} statement ${index + 1}/${statements.length} failed.`);
      console.error(statement.slice(0, 3000));
      throw error;
    }
  }
}

async function runServiceMigrations(plan) {
  const serverConn = await mysql.createConnection(baseConfig);
  await ensureDatabaseExists(serverConn, plan.database);
  await serverConn.end();

  const conn = await mysql.createConnection({
    ...baseConfig,
    database: plan.database,
  });

  try {
    await ensureMigrationTable(conn);

    if (plan.preSql && plan.preSql.length > 0) {
      for (const preStatement of plan.preSql) {
        await conn.query(preStatement);
      }
      console.log(`[${plan.service}] Applied compatibility pre-SQL.`);
    }

    for (const filePath of plan.files) {
      const migrationName = path.basename(filePath);
      const rawSql = fs.readFileSync(filePath, 'utf8');
      const migrationChecksum = checksum(rawSql);

      const alreadyApplied = await isMigrationApplied(conn, migrationName);
      if (alreadyApplied) {
        console.log(`[${plan.service}] SKIP ${migrationName} (already applied)`);
        continue;
      }

      const statements = parseSqlStatements(rawSql);
      if (statements.length === 0) {
        console.log(`[${plan.service}] SKIP ${migrationName} (no executable statements)`);
        await markMigrationApplied(conn, migrationName, migrationChecksum);
        continue;
      }

      console.log(`[${plan.service}] APPLY ${migrationName} (${statements.length} statements)`);
      await executeStatements(conn, statements, migrationName);
      await markMigrationApplied(conn, migrationName, migrationChecksum);
      console.log(`[${plan.service}] DONE ${migrationName}`);
    }
  } finally {
    await conn.end();
  }
}

async function main() {
  console.log(`Running Azure DB migrations on ${DB_HOST}:${DB_PORT} as ${DB_USER}`);

  for (const plan of migrationPlans) {
    console.log(`\n=== ${plan.service.toUpperCase()} (${plan.database}) ===`);
    await runServiceMigrations(plan);
  }

  console.log('\nAll microservice migrations completed successfully.');
}

main().catch((error) => {
  console.error('\nMigration failed:', error.message);
  process.exit(1);
});
