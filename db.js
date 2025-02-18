const mariadb = require('mariadb');
const dotenv = require('dotenv');

dotenv.config();

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5
});

// Initialize the database
async function initializeDatabase() {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query(`
            CREATE TABLE IF NOT EXISTS items (
                id INT AUTO_INCREMENT,
                name VARCHAR(255) NOT NULL,
                date DATETIME NOT NULL,
                bought_date DATETIME DEFAULT NULL,
                price DECIMAL(10, 2) DEFAULT 0.00,
                quantity INT DEFAULT 1,
                total DECIMAL(10, 2) GENERATED ALWAYS AS (price * quantity) STORED,
                created_by VARCHAR(255),
                bought_by VARCHAR(255) DEFAULT NULL,
                archived BOOLEAN DEFAULT FALSE,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB
        `);

        await conn.query(`CREATE TABLE IF NOT EXISTS users (
            username VARCHAR(255) PRIMARY KEY,
            password VARCHAR(255),
            isAdmin BOOLEAN
        )`);
    } finally {
        if (conn) conn.release();
    }
}

// Get all items, optionally including archived items
async function getItems(includeArchived) {
    let conn;
    try {
        conn = await pool.getConnection();
        const query = includeArchived ?
          "SELECT id, name, date, bought_date, price, quantity, bought_by, created_by FROM items" :
          "SELECT id, name, date, bought_date, price, quantity, bought_by, created_by FROM items WHERE archived = 0";
        const rows = await conn.query(query);
        return rows;
    } finally {
        if (conn) conn.release();
    }
}

// Function to add a new item to the database
async function addItem(item) {
    let conn;
    try {
        conn = await pool.getConnection();
        
        console.log('Executing query with params:', [
            item.name,
            item.date,
            item.price,
            item.quantity,
            item.created_by
        ]);

        const result = await conn.query(
            'INSERT INTO items (name, date, price, quantity, created_by) VALUES (?, ?, ?, ?, ?)',
            [item.name, item.date, item.price, item.quantity, item.created_by]
        );

        if (!result || !result.insertId) {
            throw new Error('Insert failed');
        }

        const [newItem] = await conn.query(
            'SELECT * FROM items WHERE id = ?',
            [result.insertId]
        );

        console.log('Retrieved new item:', newItem);
        return newItem;

    } catch (error) {
        console.error('Database error:', error);
        throw error;
    } finally {
        if (conn) await conn.release();
    }
}

// Mark an item as bought
async function markAsBought(itemId, username) {
    let conn;
    try {
        conn = await pool.getConnection();
        const query = `
            UPDATE items 
            SET bought_date = NOW(), 
                bought_by = ? 
            WHERE id = ?`;
        await conn.query(query, [username, itemId]);
    } finally {
        if (conn) conn.release();
    }
}

// Archive an item
async function archiveItem(itemId) {
    let conn;
    try {
        conn = await pool.getConnection();
        const query = `UPDATE items SET archived = TRUE WHERE id = ?`;
        await conn.query(query, [itemId]);
    } finally {
        if (conn) conn.release();
    }
}

// Authenticate a user
async function authenticateUser(username, password) {
    let conn;
    try {
        conn = await pool.getConnection();
        const query = `SELECT * FROM users WHERE username = ? AND password = ?`;
        const rows = await conn.query(query, [username, password]);
        return rows[0];
    } finally {
        if (conn) conn.release();
    }
}

// Add a function to get a user by username (without checking password)
async function getUserByUsername(username) {
    let conn;
    try {
        conn = await pool.getConnection();
        const query = `SELECT * FROM users WHERE username = ?`;
        const rows = await conn.query(query, [username]);
        return rows[0];
    } finally {
        if (conn) conn.release();
    }
}

// Create a new user
async function createUser(username, password, isAdmin) {
    let conn;
    try {
        conn = await pool.getConnection();
        const query = `INSERT INTO users (username, password, isAdmin) VALUES (?, ?, ?)`
        await conn.query(query, [username, password, isAdmin]);
    } finally {
        if (conn) conn.release();
    }
}

// Update a user's password and admin status
async function updateUser(username, password, isAdmin) {
    let conn;
    try {
        conn = await pool.getConnection();
        const query = `UPDATE users SET password = ?, isAdmin = ? WHERE username = ?`;
        await conn.query(query, [password, isAdmin, username]);
    } finally {
        if (conn) conn.release();
    }
}

// Delete a user
async function deleteUser(username) {
    let conn;
    try {
        conn = await pool.getConnection();
        const query = `DELETE FROM users WHERE username = ?`;
        await conn.query(query, [username]);
    } finally {
        if (conn) conn.release();
    }
}

// Get all users
async function getUsers() {
    let conn;
    try {
        conn = await pool.getConnection();
        const query = `SELECT * FROM users`;
        const rows = await conn.query(query);
        return rows;
    } finally {
        if (conn) conn.release();
    }
}

// Add this new function at an appropriate location
async function updateItem(item) {
    let conn;
    try {
        conn = await pool.getConnection();
        const query = `
            UPDATE items 
            SET name = ?, date = ?, bought_date = ?, price = ?, quantity = ? 
            WHERE id = ?
        `;
        await conn.query(query, [
            item.name,
            item.date,
            item.bought_date,
            item.price,
            item.quantity,
            item.id
        ]);
    } finally {
        if (conn) conn.release();
    }
}

module.exports = {
    initializeDatabase,
    getItems,
    addItem,
    markAsBought,
    archiveItem,
    authenticateUser,
    createUser,
    updateUser,
    deleteUser,
    getUsers,
    getUserByUsername, // Export new function
    updateItem // Export new function
};
