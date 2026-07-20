require('dotenv').config();
const mariadb = require('mariadb');
const path = require('path');
const fs = require('fs');

async function runMigrations() {
    const pool = mariadb.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        connectionLimit: 1
    });

    let conn;
    try {
        conn = await pool.getConnection();

        await conn.query(`CREATE TABLE IF NOT EXISTS migrations (
            name VARCHAR(255) PRIMARY KEY,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        const migrationsDir = path.join(__dirname, 'migrations');
        if (!fs.existsSync(migrationsDir)) {
            console.log('No migrations directory found');
            return;
        }

        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.js'))
            .sort();

        let count = 0;
        for (const file of files) {
            const migration = require(path.join(migrationsDir, file));
            const alreadyRun = await conn.query('SELECT name FROM migrations WHERE name = ?', [migration.name]);
            if (alreadyRun.length > 0) {
                console.log(`Skipping ${migration.name} (already applied)`);
                continue;
            }

            console.log(`Running ${migration.name}...`);
            await migration.up(conn);
            await conn.query('INSERT INTO migrations (name) VALUES (?)', [migration.name]);
            console.log(`Applied ${migration.name}`);
            count++;
        }

        console.log(`Done. ${count} migration(s) applied.`);
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    } finally {
        if (conn) conn.release();
        await pool.end();
    }
}

runMigrations();