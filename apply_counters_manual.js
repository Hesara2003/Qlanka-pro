const mysql = require('mysql2/promise');
async function run() {
  const conn = await mysql.createConnection({ host: 'qlanka-dbserver.mysql.database.azure.com', user: 'qlankaadmin', password: 'Diabalo666', ssl: { rejectUnauthorized: false }, database: 'queue_db' });
  try {
      await conn.query(`
        ALTER TABLE counters
          ADD COLUMN assigned_officer_user_id INT NULL AFTER current_token_id,
          ADD COLUMN closed_reason VARCHAR(500) NULL AFTER status;
      `);
      console.log("added missing columns");
  } catch(e) { console.log(e.message); }
  const [rows] = await conn.query('SHOW COLUMNS FROM queue_db.counters');
  console.log(rows.map(r => r.Field));
  await conn.end();
}
run();
