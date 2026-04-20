const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
      host: 'identity-db.mysql.database.azure.com',
      user: 'admin_identity',
      password: 'Diabalo@666',
      ssl: { rejectUnauthorized: false }
  });

  try {
      await conn.query('INSERT IGNORE INTO queue.users SELECT * FROM identity.users');
      console.log("Synced users to queue");
  } catch(e) {
      console.error("ERR:", e.message);
  }

  await conn.end();
}

run().catch(console.error);
