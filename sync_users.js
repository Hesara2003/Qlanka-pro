const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
      host: 'qlanka-dbserver.mysql.database.azure.com',
      user: 'qlankaadmin',
      password: 'Diabalo666',
      ssl: { rejectUnauthorized: false }
  });

  try {
      await conn.query('INSERT IGNORE INTO queue_db.users SELECT * FROM identity_db.users');
      console.log("Synced users to queue_db");
  } catch(e) {
      console.error("ERR:", e.message);
  }

  await conn.end();
}

run().catch(console.error);
