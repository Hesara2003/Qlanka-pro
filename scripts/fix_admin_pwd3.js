const mysql = require('mysql2/promise');

async function main() {
    const conn = await mysql.createConnection({
        host: 'identity-db.mysql.database.azure.com',
        user: 'admin_malin',
        password: 'Password123!',
        database: 'identity',
        ssl: { rejectUnauthorized: false }
    });

    const hash = '$2a$11$qbLgm.P0bCupCpQ6A71mLOcC/7FDeUmFOlmC5qnfBqweIOjlNBdk2';
    
    await conn.query(`UPDATE users SET password_hash = ? WHERE username = 'seed_admin'`, [hash]);
    console.log("Updated seed_admin hash to represent 'Admin123!'");
    process.exit(0);
}
main().catch(console.error);