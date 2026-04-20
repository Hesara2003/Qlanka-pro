const mysql = require('mysql2/promise');
async function run() {
  const c = await mysql.createConnection({
    host: 'identity-db.mysql.database.azure.com',
    port: 3306,
    user: 'admin_identity',
    password: 'Diabalo@666',
    database: 'identity',
    ssl: { rejectUnauthorized: false }
  });
  const [rows] = await c.query("SELECT password_hash FROM users WHERE username = 'healthcheck_admin'");
  console.log('Template hash:', rows[0].password_hash);
  await c.query("UPDATE users SET password_hash = ? WHERE username = 'seed_admin'", [rows[0].password_hash]);
  console.log("Updated seed_admin to use healthcheck_admin hash password");
  c.end();
}
run();