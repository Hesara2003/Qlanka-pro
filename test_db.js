const mysql = require('mysql2/promise');

const config = {
  host: 'qlanka-dbserver.mysql.database.azure.com',
  port: 3306,
  user: 'qlankaadmin',
  password: 'Diabalo666',
  ssl: { rejectUnauthorized: false }
};

async function check() {
  try {
    const conn = await mysql.createConnection(config);
    console.log("Connected to Azure MySQL Server successfully.");
    const [dbs] = await conn.execute("SHOW DATABASES;");
    console.log("Databases:", dbs.map(d => d.Database));

    const connSC = await mysql.createConnection({ ...config, database: 'servicecenters_db' });
    const [centers] = await connSC.execute("SELECT * FROM centers LIMIT 2;");
    console.log("Centers:", centers);
    await connSC.end();

    await conn.end();
  } catch (err) {
    console.error("Connection failed:", err.message);
  }
}

check();
