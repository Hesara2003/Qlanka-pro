const mysql = require('mysql2/promise');

function getArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function run() {
  const counterArg = getArg('--counter') || process.env.COUNTER_ID;
  const countArg = getArg('--count') || process.env.COUNT || '1';

  const counterId = Number(counterArg);
  const count = Number(countArg);

  if (!Number.isInteger(counterId) || counterId <= 0) {
    throw new Error('Provide a valid counter id: --counter <id>');
  }

  if (!Number.isInteger(count) || count <= 0 || count > 50) {
    throw new Error('Provide a valid count between 1 and 50: --count <n>');
  }

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'qlanka-dbserver.mysql.database.azure.com',
    user: process.env.DB_USER || 'qlankaadmin',
    password: process.env.DB_PASS || 'Diabalo666',
    ssl: { rejectUnauthorized: false },
    database: process.env.DB_NAME || 'queue_db',
  });

  const [counterRows] = await conn.query(
    'SELECT counter_id, center_id, status FROM counters WHERE counter_id = ?',
    [counterId]
  );

  const counter = counterRows[0];
  if (!counter) {
    throw new Error(`Counter not found: ${counterId}`);
  }

  const [maxRows] = await conn.query(
    "SELECT COALESCE(MAX(queue_position), 0) AS maxPos FROM tokens WHERE counter_id = ? AND issued_date = CURDATE() AND status = 'Waiting'",
    [counterId]
  );

  let nextPos = Number(maxRows[0]?.maxPos || 0) + 1;
  const inserted = [];

  for (let i = 0; i < count; i += 1) {
    const tokenNumber = `MANUAL-${Date.now()}-${i + 1}`;

    const [insertResult] = await conn.query(
      'INSERT INTO tokens (center_id, counter_id, user_id, appointment_id, token_number, issued_date, status, issued_time, queue_position) VALUES (?, ?, ?, ?, ?, CURDATE(), ?, UTC_TIMESTAMP(), ?)',
      [counter.center_id, counterId, null, null, tokenNumber, 'Waiting', nextPos]
    );

    inserted.push({
      tokenId: insertResult.insertId,
      tokenNumber,
      queuePosition: nextPos,
    });

    nextPos += 1;
  }

  await conn.end();

  console.log(
    JSON.stringify(
      {
        centerId: counter.center_id,
        counterId,
        counterStatus: counter.status,
        insertedCount: inserted.length,
        inserted,
      },
      null,
      2
    )
  );
}

run().catch((err) => {
  console.error(err.message || String(err));
  process.exit(1);
});
