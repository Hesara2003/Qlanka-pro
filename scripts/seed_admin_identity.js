const mysql = require('mysql2/promise');

const cfg = {
  host: 'qlanka-dbserver.mysql.database.azure.com',
  port: 3306,
  user: 'qlankaadmin',
  password: 'Diabalo666',
  ssl: { rejectUnauthorized: false },
  database: 'identity_db'
};

const TARGET_USERNAME = 'seed_admin';
const TARGET_EMAIL = 'seed.admin@queuelanka.test';
const TARGET_PASSWORD_NOTE = 'Test@1234';

async function run() {
  const conn = await mysql.createConnection(cfg);

  const [existingRows] = await conn.query(
    'SELECT user_id, username, role FROM users WHERE username = ? LIMIT 1',
    [TARGET_USERNAME]
  );

  if (existingRows.length > 0) {
    const existing = existingRows[0];
    await conn.query(
      `UPDATE users
       SET role = 'admin', is_active = 1, is_email_verified = 1, center_id = NULL
       WHERE user_id = ?`,
      [existing.user_id]
    );

    console.log(JSON.stringify({
      action: 'promoted_existing_user',
      userId: existing.user_id,
      username: existing.username,
      password: TARGET_PASSWORD_NOTE
    }, null, 2));

    await conn.end();
    return;
  }

  const [templateRows] = await conn.query(
    `SELECT password_hash
     FROM users
     WHERE password_hash IS NOT NULL
       AND password_hash <> ''
       AND (username LIKE 'citizen_%' OR username LIKE 'officer_%' OR username LIKE 'book_%' OR username LIKE 'api_%')
     ORDER BY user_id DESC
     LIMIT 1`
  );

  if (templateRows.length === 0) {
    throw new Error('No template password hash found. Create any user via /api/auth/register first, then retry.');
  }

  const templateHash = templateRows[0].password_hash;

  const [insertResult] = await conn.query(
    `INSERT INTO users
      (username, email, password_hash, role, center_id, is_active, is_email_verified, created_at)
     VALUES
      (?, ?, ?, 'admin', NULL, 1, 1, UTC_TIMESTAMP())`,
    [TARGET_USERNAME, TARGET_EMAIL, templateHash]
  );

  console.log(JSON.stringify({
    action: 'created_admin_user',
    userId: insertResult.insertId,
    username: TARGET_USERNAME,
    email: TARGET_EMAIL,
    password: TARGET_PASSWORD_NOTE
  }, null, 2));

  await conn.end();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
