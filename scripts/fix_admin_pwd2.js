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
  const [rows] = await c.query("SELECT password_hash FROM users WHERE username = 'Hesara'");
  console.log('Template hash:', rows[0].password_hash);
  await c.query("UPDATE users SET password_hash = ? WHERE username = 'seed_admin'", [rows[0].password_hash]);
  console.log("Updated seed_admin to use Hesara hash password");
  c.end();
}
run();