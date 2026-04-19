const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: 'qlanka-dbserver.mysql.database.azure.com',
    user: 'qlankaadmin',
    password: 'Diabalo666',
    database: 'queue_db',
    ssl: { rejectUnauthorized: false },
  });

  const [cols] = await conn.query('SHOW COLUMNS FROM tokens');
  console.log(cols.map(c => c.Field));

  await conn.end();
})();
