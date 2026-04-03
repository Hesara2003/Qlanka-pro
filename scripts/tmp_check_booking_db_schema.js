const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'qlanka-dbserver.mysql.database.azure.com',
    port: 3306,
    user: 'qlankaadmin',
    password: 'Diabalo666',
    database: 'queue_db',
    ssl: { rejectUnauthorized: false },
  });

  const [tokens] = await conn.query(
    "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tokens' ORDER BY ORDINAL_POSITION"
  );

  const [appointments] = await conn.query(
    "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appointments' ORDER BY ORDINAL_POSITION"
  );

  const [users] = await conn.query(
    "SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' ORDER BY ORDINAL_POSITION"
  );

  const [userConstraints] = await conn.query(
    "SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'"
  );

  const [userIndexes] = await conn.query(
    "SELECT INDEX_NAME, NON_UNIQUE, COLUMN_NAME, SEQ_IN_INDEX FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' ORDER BY INDEX_NAME, SEQ_IN_INDEX"
  );

  const [procRows] = await conn.query('SHOW CREATE PROCEDURE sp_book_token');
  const proc = procRows?.[0]?.['Create Procedure'] || null;

  console.log(
    JSON.stringify(
      {
        tokens,
        appointments,
        users,
        userConstraints,
        userIndexes,
        proc,
      },
      null,
      2
    )
  );

  await conn.end();
}

main().catch((err) => {
  console.error(JSON.stringify({ fatal: err.message }, null, 2));
  process.exit(1);
});
