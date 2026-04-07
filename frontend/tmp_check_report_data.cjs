const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'qlanka-dbserver.mysql.database.azure.com',
    user: 'qlankaadmin',
    password: 'Diabalo666',
    database: 'queue_db',
    ssl: { rejectUnauthorized: false },
  });

  const [recent] = await conn.query(`
    SELECT COUNT(*) AS c
    FROM tokens
    WHERE issued_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND CURDATE()
  `);

  const [byCenter] = await conn.query(`
    SELECT center_id, COUNT(*) AS c, MIN(issued_date) AS min_date, MAX(issued_date) AS max_date
    FROM tokens
    GROUP BY center_id
    ORDER BY c DESC
    LIMIT 10
  `);

  const [allCount] = await conn.query('SELECT COUNT(*) AS c FROM tokens');

  console.log('tokens_last_30_days:', recent[0]?.c ?? 0);
  console.log('tokens_total:', allCount[0]?.c ?? 0);
  console.log('tokens_by_center:', byCenter);

  await conn.end();
})();
