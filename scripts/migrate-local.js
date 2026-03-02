const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const config = {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'queuelanka',
    multipleStatements: true,
};

const migrationsDir = path.join(__dirname, 'backend', 'QueueLanka.API', 'Database', 'Migrations');

async function run() {
    const connection = await mysql.createConnection(config);
    console.log('Connected to Local MySQL ✓');

    const files = ['004_appointments.sql'];

    for (const file of files) {
        const filePath = path.join(migrationsDir, file);
        const rawSql = fs.readFileSync(filePath, 'utf8');

        console.log(`\nRunning ${file}...`);
        try {
            await connection.query(rawSql);
            console.log(`  ✓ ${file} applied`);
        } catch (err) {
            console.error(`  ✗ ${file} failed: ${err.message}`);
        }
    }

    // Verify tables
    const [rows] = await connection.query('SHOW TABLES;');
    console.log('\nTables in local database:');
    rows.forEach(r => console.log(' -', Object.values(r)[0]));

    await connection.end();
}

run().catch(err => {
    console.error('Fatal:', err.message);
    process.exit(1);
});
