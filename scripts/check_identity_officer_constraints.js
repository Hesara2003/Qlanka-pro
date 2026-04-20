const mysql = require('mysql2/promise');

const cfg = {
  host: 'identity-db.mysql.database.azure.com',
  port: 3306,
  user: 'admin_identity',
  password: 'Diabalo@666',
  ssl: { rejectUnauthorized: false },
  database: 'identity'
};

async function run() {
  const c = await mysql.createConnection(cfg);

  const [tables] = await c.query(`
    SELECT TABLE_NAME
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = 'identity'
      AND TABLE_NAME IN ('users', 'centers')
    ORDER BY TABLE_NAME
  `);

  const [constraints] = await c.query(`
    SELECT
      CONSTRAINT_NAME,
      TABLE_NAME,
      COLUMN_NAME,
      REFERENCED_TABLE_NAME,
      REFERENCED_COLUMN_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = 'identity'
      AND TABLE_NAME = 'users'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    ORDER BY CONSTRAINT_NAME
  `);

  const [recentUsers] = await c.query(`
    SELECT user_id, username, role, center_id
    FROM users
    ORDER BY user_id DESC
    LIMIT 15
  `);

  console.log(JSON.stringify({ tables, constraints, recentUsers }, null, 2));

  await c.end();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
