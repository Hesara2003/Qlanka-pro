const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: 'qlanka-dbserver.mysql.database.azure.com',
    user: 'qlankaadmin',
    password: 'Diabalo666',
    ssl: { rejectUnauthorized: false },
    database: 'queue_db',
  });

  const counterId = 8;
  const [counterRows] = await conn.query(
    'SELECT counter_id, center_id, status FROM counters WHERE counter_id = ?',
    [counterId]
  );

  const counter = counterRows[0];
  if (!counter) {
    throw new Error('Counter not found: ' + counterId);
  }

  const [maxRows] = await conn.query(
    "SELECT COALESCE(MAX(queue_position), 0) AS maxPos FROM tokens WHERE counter_id = ? AND issued_date = CURDATE() AND status = 'Waiting'",
    [counterId]
  );

  const maxPos = Number(maxRows[0]?.maxPos || 0);
  const nextPos = maxPos + 1;
  const tokenNumber = `MANUAL-${Date.now()}`;

  const [insertResult] = await conn.query(
    'INSERT INTO tokens (center_id, counter_id, user_id, appointment_id, token_number, issued_date, status, issued_time, queue_position) VALUES (?, ?, ?, ?, ?, CURDATE(), ?, UTC_TIMESTAMP(), ?)',
    [counter.center_id, counterId, null, null, tokenNumber, 'Waiting', nextPos]
  );

  console.log(
    JSON.stringify(
      {
        insertedTokenId: insertResult.insertId,
        tokenNumber,
        centerId: counter.center_id,
        counterId,
        counterStatus: counter.status,
        queuePosition: nextPos,
      },
      null,
      2
    )
  );

  await conn.end();
}

run().catch((err) => {
  console.error(err.message || String(err));
  process.exit(1);
});
