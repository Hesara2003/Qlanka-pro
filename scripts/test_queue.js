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
    const [rows] = await c.query("SELECT t.token_id, t.center_id, t.user_id, t.appointment_id, t.token_number, t.issued_date, t.status, t.issued_time, t.estimated_service_time, t.served_time, t.completed_time, t.cancelled_at, t.called_at, t.created_at, t.updated_at, t.queue_position FROM tokens t WHERE t.status = 'Waiting' AND t.counter_id = 1 ORDER BY t.queue_position ASC, t.token_number ASC");
    console.log('success');
  } catch(e) {
    console.log("SQL ERROR:", e.message);
  }
  c.end();
}
run();