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
  const conn = await mysql.createConnection(cfg);

  await conn.beginTransaction();

  await conn.query(`
    INSERT INTO identity.centers (
      center_id,
      name,
      address,
      timezone,
      capacity,
      is_active,
      created_at,
      phone,
      email,
      description,
      opening_time,
      closing_time,
      updated_at,
      average_service_time_minutes
    )
    SELECT
      center_id,
      name,
      address,
      timezone,
      capacity,
      is_active,
      created_at,
      phone,
      email,
      description,
      opening_time,
      closing_time,
      updated_at,
      average_service_time_minutes
    FROM \`service-centre\`.centers
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      address = VALUES(address),
      timezone = VALUES(timezone),
      capacity = VALUES(capacity),
      is_active = VALUES(is_active),
      phone = VALUES(phone),
      email = VALUES(email),
      description = VALUES(description),
      opening_time = VALUES(opening_time),
      closing_time = VALUES(closing_time),
      updated_at = VALUES(updated_at),
      average_service_time_minutes = VALUES(average_service_time_minutes)
  `);

  const [[count]] = await conn.query('SELECT COUNT(*) AS c FROM identity.centers');

  await conn.commit();

  console.log(JSON.stringify({ syncedIdentityCenters: count.c }, null, 2));

  await conn.end();
}

run().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
