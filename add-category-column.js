const mariadb = require('mariadb');
require('dotenv').config();

async function addCategoryColumn() {
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
        console.log('Connected to database');

        // Add category column if it doesn't exist
        await conn.query(`
            ALTER TABLE items 
            ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'General'
        `);
        console.log('Category column added/verified');

        console.log('\nDatabase migration completed successfully!');
        console.log('========================================');

    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        if (conn) conn.release();
        pool.end();
    }
}

addCategoryColumn();