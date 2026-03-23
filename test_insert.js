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

  try {
      const [r] = await conn.query(`INSERT INTO queue_db.appointments (center_id, user_id, appointment_date, appointment_time, status) VALUES (1, 25, '2026-03-24', '09:00:00', 'Scheduled')`);
      console.log("Inserted:", r);
  } catch(e) {
      console.error("ERR:", e.message);
  }

  await conn.end();
}

run().catch(console.error);
