const mariadb = require('mariadb');
const bcrypt = require('bcryptjs');
const db = require('./db');

require('dotenv').config();

async function initializeDatabase() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log('Connected to database');

        // Use db.createTable from db.js instead of duplicate table creation
        await db.createTable();
        console.log('Tables created/verified via db.createTable()');

        // Clear existing users (for demo setup)
        await conn.query('TRUNCATE TABLE users');

        // Create admin user with hashed password
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await conn.query(
            'INSERT INTO users (username, password, isAdmin) VALUES (?, ?, ?)',
            ['admin', hashedPassword, true]
        );
        console.log('Admin user created: admin / admin123');

        // Create regular user with hashed password
        const hashedUserPassword = await bcrypt.hash('user123', 10);
        await conn.query(
            'INSERT INTO users (username, password, isAdmin) VALUES (?, ?, ?)',
            ['user', hashedUserPassword, false]
        );
        console.log('Regular user created: user / user123');

        // Insert sample items
        const sampleItems = [
            { name: 'Milk', date: new Date(), category: 'Dairy', price: 3.99, quantity: 1, created_by: 'admin' },
            { name: 'Bread', date: new Date(), category: 'Bakery', price: 2.49, quantity: 1, created_by: 'admin' },
            { name: 'Eggs', date: new Date(), category: 'Dairy', price: 4.99, quantity: 1, created_by: 'admin' },
            { name: 'Apples', date: new Date(), category: 'Produce', price: 1.99, quantity: 2, created_by: 'admin' },
            { name: 'Chicken Breast', date: new Date(), category: 'Meat', price: 8.99, quantity: 1, created_by: 'admin' }
        ];

        for (const item of sampleItems) {
            const dateStr = item.date ? item.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            const boughtDateStr = item.bought_date ? item.bought_date.toISOString() : null;
            
            await conn.query(
                'INSERT INTO items (name, date, bought_date, category, price, quantity, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [item.name, dateStr, boughtDateStr, item.category, item.price, item.quantity, item.created_by]
            );
        }
        console.log(`Inserted ${sampleItems.length} sample items`);

        console.log('\nDatabase initialization completed successfully!');
        console.log('========================================');
        console.log('Demo Credentials:');
        console.log('  Admin: admin / admin123');
        console.log('  User: user / user123');
        console.log('========================================\n');

    } catch (error) {
        console.error('Database initialization error:', error);
    } finally {
        if (conn) conn.release();
    }
}

// Create pool for this script
const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 1
});

initializeDatabase();
