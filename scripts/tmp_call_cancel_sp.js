const mysql = require('mysql2/promise');

async function main() {
  const tokenId = Number(process.env.TOKEN_ID || '6');
  const userId = Number(process.env.USER_ID || '26');
  const isAdmin = Number(process.env.IS_ADMIN || '0');

  const conn = await mysql.createConnection({
    host: 'qlanka-dbserver.mysql.database.azure.com',
    port: 3306,
    user: 'qlankaadmin',
    password: 'Diabalo666',
    database: 'queue_db',
    ssl: { rejectUnauthorized: false },
    multipleStatements: true,
  });

  const sql = `
SET @p_success = 0;
CALL sp_cancel_token_shift_queue(?, ?, ?, @p_success);
SELECT @p_success AS success;
SELECT token_id, status, queue_position, cancelled_at FROM tokens WHERE token_id = ?;
`;

  try {
    const [rows] = await conn.query(sql, [tokenId, userId, isAdmin, tokenId]);
    console.log(JSON.stringify({ ok: true, rows }, null, 2));
  } catch (err) {
    console.log(JSON.stringify({ ok: false, message: err.message, code: err.code, errno: err.errno, sqlState: err.sqlState }, null, 2));
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(JSON.stringify({ fatal: err.message }, null, 2));
  process.exit(1);
});
