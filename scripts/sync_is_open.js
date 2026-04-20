const mysql = require('mysql2/promise');
async function run() {
  const c = await mysql.createConnection({
    host: 'identity-db.mysql.database.azure.com',
    port: 3306,
    user: 'admin_identity',
    password: 'Diabalo@666',
    database: 'queue',
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