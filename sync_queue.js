const mysql = require('mysql2/promise');

const cfg = {
  host: 'qlanka-dbserver.mysql.database.azure.com',
  port: 3306,
  user: 'qlankaadmin',
  password: 'Diabalo666',
  ssl: { rejectUnauthorized: false },
};

async function run() {
  const conn = await mysql.createConnection(cfg);

  await conn.query(`
    INSERT IGNORE INTO queue_db.centers (
      center_id, name, address, timezone, capacity, is_active, created_at, phone, email, description, opening_time, closing_time, updated_at, average_service_time_minutes
    )
    SELECT
      center_id, name, address, timezone, capacity, is_active, created_at, phone, email, description, opening_time, closing_time, updated_at, average_service_time_minutes
    FROM servicecenters_db.centers
  `);

  const [[count]] = await conn.query('SELECT COUNT(*) AS c FROM queue_db.centers');
  console.log("Centers in queue_db:", count.c);
  await conn.end();
}

run().catch(console.error);
