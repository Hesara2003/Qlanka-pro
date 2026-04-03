const mysql = require('mysql2/promise');

const cfg = {
  host: process.env.DB_HOST || 'qlanka-dbserver.mysql.database.azure.com',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'qlankaadmin',
  password: process.env.DB_PASSWORD || 'Diabalo666',
  database: process.env.DB_NAME || 'queue_db',
  ssl: { rejectUnauthorized: false },
};

async function main() {
  const conn = await mysql.createConnection(cfg);

  await conn.query(`
    ALTER TABLE tokens
    MODIFY COLUMN status ENUM('Waiting','Called','Serving','Served','Completed','Skipped','Cancelled','NoShow')
    NOT NULL DEFAULT 'Waiting'
  `);

  const [rows] = await conn.query(
    "SELECT COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tokens' AND COLUMN_NAME = 'status'"
  );

  console.log(JSON.stringify({ statusEnum: rows?.[0]?.COLUMN_TYPE || null }, null, 2));
  await conn.end();
}

main().catch((err) => {
  console.error(JSON.stringify({ fatal: err.message }, null, 2));
  process.exit(1);
});
