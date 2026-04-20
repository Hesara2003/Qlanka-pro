const mysql = require('mysql2/promise');

const cfg = {
  host: 'identity-db.mysql.database.azure.com',
  port: 3306,
  user: 'admin_identity',
  password: 'Diabalo@666',
  ssl: { rejectUnauthorized: false },
};

async function run() {
  const conn = await mysql.createConnection(cfg);

  await conn.query(`
    INSERT IGNORE INTO queue.centers (
      center_id, name, address, timezone, capacity, is_active, created_at, phone, email, description, opening_time, closing_time, updated_at, average_service_time_minutes
    )
    SELECT
      center_id, name, address, timezone, capacity, is_active, created_at, phone, email, description, opening_time, closing_time, updated_at, average_service_time_minutes
    FROM \`service-centre\`.centers
  `);

  const [[count]] = await conn.query('SELECT COUNT(*) AS c FROM queue.centers');
  console.log("Centers in queue:", count.c);
  await conn.end();
}

run().catch(console.error);
