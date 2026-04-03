const mysql = require('mysql2/promise');

async function main() {
  const tokenId = Number(process.env.TOKEN_ID || '6');
  const conn = await mysql.createConnection({
    host: 'qlanka-dbserver.mysql.database.azure.com',
    port: 3306,
    user: 'qlankaadmin',
    password: 'Diabalo666',
    database: 'queue_db',
    ssl: { rejectUnauthorized: false },
  });

  const [rows] = await conn.query(
    'SELECT token_id, user_id, status, queue_position, cancelled_at, updated_at FROM tokens WHERE token_id = ?',
    [tokenId]
  );

  console.log(JSON.stringify({ tokenId, rows }, null, 2));
  await conn.end();
}

main().catch((err) => {
  console.error(JSON.stringify({ fatal: err.message }, null, 2));
  process.exit(1);
});
