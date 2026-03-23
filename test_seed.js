const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({ host: 'qlanka-dbserver.mysql.database.azure.com', user: 'qlankaadmin', password: 'Diabalo666', ssl: { rejectUnauthorized: false }, database: 'queue_db' });
  await conn.query(`INSERT IGNORE INTO queue_db.counters (center_id, name, status, assigned_officer_user_id) VALUES (1, 'Main Counter', 'Closed', 25)`);
  console.log("seeded");
  await conn.end();
}
run();
