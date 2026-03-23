const mysql = require('mysql2/promise');
async function run() {
  const c = await mysql.createConnection({
    host: 'qlanka-dbserver.mysql.database.azure.com',
    port: 3306,
    user: 'qlankaadmin',
    password: 'Diabalo666',
    database: 'identity_db',
    ssl: { rejectUnauthorized: false }
  });
  const hash = '$2a$11$qbLgm.P0bCupCpQ6A71mLOcC/7FDeUmFOlmC5qnfBqweIOjlNBdk2';
  await c.query("UPDATE users SET password_hash = ? WHERE username = 'seed_admin'", [hash]);
  console.log("Updated seed_admin to Admin123!");
  c.end();
}
run();