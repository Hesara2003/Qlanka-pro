const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({ host: 'identity-db.mysql.database.azure.com', user: 'admin_identity', password: 'Diabalo@666', ssl: { rejectUnauthorized: false }, database: 'queue' });
  await conn.query(`INSERT IGNORE INTO queue.counters (center_id, name, status, assigned_officer_user_id) VALUES (1, 'Main Counter', 'Closed', 25)`);
  console.log("seeded");
  await conn.end();
}
run();
