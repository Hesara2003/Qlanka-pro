const mysql = require('mysql2/promise');
async function run() {
  const c = await mysql.createConnection({
    host: 'qlanka-dbserver.mysql.database.azure.com',
    port: 3306,
    user: 'qlankaadmin',
    password: 'Diabalo666',
    database: 'queue_db',
    ssl: { rejectUnauthorized: false }
  });
  try {
    await c.query("UPDATE counters SET is_open = 1 WHERE status = 'Open';");
    console.log('Synced is_open');
  } catch (e) {
    console.error(e)
  }
  c.end();
}
run();