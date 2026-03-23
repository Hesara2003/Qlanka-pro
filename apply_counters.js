const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function run() {
  const conn = await mysql.createConnection({
      host: 'qlanka-dbserver.mysql.database.azure.com',
      user: 'qlankaadmin',
      password: 'Diabalo666',
      ssl: { rejectUnauthorized: false },
      database: 'queue_db',
      multipleStatements: true
  });

  const sql1 = fs.readFileSync('backend/QueueLanka.Queue/Database/Migrations/002_counter_schema.sql', 'utf8');
  await conn.query(sql1);
  console.log("002_counter_schema applied.");

  const sql2 = fs.readFileSync('backend/QueueLanka.Queue/Database/Migrations/007_counter_management_schema.sql', 'utf8');
  await conn.query(sql2);
  console.log("007_counter_management_schema applied.");

  await conn.end();
}
run().catch(console.error);
