// Ensures an officer user exists in DB with a known login password by reusing seed_admin hash.

const mysql = require('mysql2/promise');

const cfg = {
  host: process.env.DB_HOST || 'qlanka-dbserver.mysql.database.azure.com',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'qlankaadmin',
  password: process.env.DB_PASSWORD || 'Diabalo666',
  database: process.env.DB_NAME || 'identity_db',
  ssl: { rejectUnauthorized: false },
};

const officerUsername = process.env.OFFICER_USER || 'officer_uat';
const officerEmail = process.env.OFFICER_EMAIL || `${officerUsername}@mailinator.com`;
const templateUsername = process.env.TEMPLATE_USER || 'seed_admin';

async function main() {
  const identityConn = await mysql.createConnection({ ...cfg, database: 'identity_db' });

  const [templateRows] = await identityConn.query(
    'SELECT password_hash FROM users WHERE username = ? LIMIT 1',
    [templateUsername]
  );

  if (!templateRows.length || !templateRows[0].password_hash) {
    throw new Error(`Template user ${templateUsername} password hash not found.`);
  }

  const hash = templateRows[0].password_hash;

  const [existing] = await identityConn.query('SELECT user_id, username FROM users WHERE username = ? LIMIT 1', [officerUsername]);

  let officerUserId = 0;

  if (existing.length) {
    officerUserId = Number(existing[0].user_id);
    await identityConn.query(
      `UPDATE users
       SET email = ?, password_hash = ?, role = 'officer', is_active = 1, is_email_verified = 1, deleted_at = NULL, updated_at = UTC_TIMESTAMP()
       WHERE username = ?`,
      [officerEmail, hash, officerUsername]
    );
  } else {
    const [insertResult] = await identityConn.query(
      `INSERT INTO users (username, email, password_hash, role, center_id, is_active, is_email_verified, created_at)
       VALUES (?, ?, ?, 'officer', NULL, 1, 1, UTC_TIMESTAMP())`,
      [officerUsername, officerEmail, hash]
    );
    officerUserId = Number(insertResult.insertId);
  }

  const [finalRows] = await identityConn.query(
    'SELECT user_id, username, role, is_active, is_email_verified FROM users WHERE username = ? LIMIT 1',
    [officerUsername]
  );

  // Ensure queue_db has the same officer identity for queue-level officer checks.
  const queueConn = await mysql.createConnection({ ...cfg, database: 'queue_db' });

  // Remove conflicting username/email rows with a different user_id so we can align IDs across DBs.
  await queueConn.query(
    'DELETE FROM users WHERE (username = ? OR email = ?) AND user_id <> ?',
    [officerUsername, officerEmail, officerUserId]
  );

  await queueConn.query(
    `INSERT INTO users (user_id, username, email, password_hash, role, center_id, is_active, is_email_verified, created_at)
     VALUES (?, ?, ?, ?, 'officer', NULL, 1, 1, UTC_TIMESTAMP())
     ON DUPLICATE KEY UPDATE
       username = VALUES(username),
       email = VALUES(email),
       password_hash = VALUES(password_hash),
       role = 'officer',
       is_active = 1,
       is_email_verified = 1,
       deleted_at = NULL,
       updated_at = UTC_TIMESTAMP()`,
    [officerUserId, officerUsername, officerEmail, hash]
  );

  const [queueRows] = await queueConn.query(
    'SELECT user_id, username, role, is_active, is_email_verified FROM users WHERE user_id = ? OR username = ? LIMIT 1',
    [officerUserId, officerUsername]
  );

  console.log(JSON.stringify({ officer: finalRows[0] || null, loginPasswordSameAsTemplateUser: templateUsername }, null, 2));
  console.log(JSON.stringify({ queueOfficer: queueRows[0] || null }, null, 2));
  await identityConn.end();
  await queueConn.end();
}

main().catch((err) => {
  console.error(JSON.stringify({ fatal: err.message }, null, 2));
  process.exit(1);
});
