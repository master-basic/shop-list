const mariadb = require('mariadb');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

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
                category VARCHAR(100),
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
            password VARCHAR(255) NOT NULL,
            isAdmin BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
          "SELECT id, name, date, bought_date, category, price, quantity, bought_by, created_by FROM items" :
          "SELECT id, name, date, bought_date, category, price, quantity, bought_by, created_by FROM items WHERE archived = 0";
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
            item.bought_date,
            item.category,
            item.price,
            item.quantity,
            item.created_by
        ]);

        const result = await conn.query(
            'INSERT INTO items (name, date, bought_date, category, price, quantity, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [item.name, item.date, item.bought_date, item.category, item.price, item.quantity, item.created_by]
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

// Authenticate a user with password verification
async function authenticateUser(username, password) {
    let conn;
    try {
        conn = await pool.getConnection();
        const query = `SELECT * FROM users WHERE username = ?`;
        const rows = await conn.query(query, [username]);
        
        if (!rows || rows.length === 0) {
            return null;
        }
        
        const user = rows[0];
        // Verify password using bcrypt
        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (!passwordMatch) {
            return null;
        }
        
        return { ...user, isAdmin: user.isAdmin };
    } finally {
        if (conn) conn.release();
    }
}

// Add a function to get a user by username (without checking password)
async function getUserByUsername(username) {
    let conn;
    try {
        conn = await pool.getConnection();
        const query = `SELECT username, isAdmin FROM users WHERE username = ?`;
        const rows = await conn.query(query, [username]);
        return rows[0];
    } finally {
        if (conn) conn.release();
    }
}

// Create a new user with hashed password
async function createUser(username, password, isAdmin) {
    let conn;
    try {
        conn = await pool.getConnection();
        
        // Check if user already exists
        const existingUser = await getUserByUsername(username);
        if (existingUser) {
            throw new Error('Username already exists');
        }
        
        // Hash password before storing
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const query = `INSERT INTO users (username, password, isAdmin) VALUES (?, ?, ?)`
        await conn.query(query, [username, hashedPassword, isAdmin || false]);
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
}

// Update a user's password and admin status
async function updateUser(username, password, isAdmin) {
    let conn;
    try {
        conn = await pool.getConnection();
        
        // If new password provided, hash it
        let hashedPassword;
        if (password) {
            hashedPassword = await bcrypt.hash(password, 10);
        } else {
            hashedPassword = null;
        }
        
        const query = `UPDATE users SET password = ?, isAdmin = ?, updated_at = NOW() WHERE username = ?`;
        await conn.query(query, [hashedPassword, isAdmin, username]);
    } catch (error) {
        console.error('Error updating user:', error);
        throw error;
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
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
}

// Get all users (excluding password)
async function getUsers() {
    let conn;
    try {
        conn = await pool.getConnection();
        const query = `SELECT username, isAdmin FROM users`;
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
            SET name = ?, date = ?, bought_date = ?, category = ?, price = ?, quantity = ? 
            WHERE id = ?
        `;
        await conn.query(query, [
            item.name,
            item.date,
            item.bought_date,
            item.category,
            item.price,
            item.quantity,
            item.id
        ]);
    } catch (error) {
        console.error('Error updating item:', error);
        throw error;
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