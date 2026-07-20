const mariadb = require('mariadb');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

// Create connection pool (used for all queries)
const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5
});

// Create table function (standalone for init-db.js)
async function createTable() {
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
                notes TEXT DEFAULT NULL,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB
        `);

        // Add notes column if missing (for existing databases)
        try {
            await conn.query(`ALTER TABLE items ADD COLUMN notes TEXT DEFAULT NULL`);
        } catch (_) { /* column already exists */ }

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

// Export createTable for init-db.js
module.exports.createTable = createTable;

// Initialize the database
async function initializeDatabase() {
    let conn;
    try {
        conn = await pool.getConnection();

        // Create tables
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
                notes TEXT DEFAULT NULL,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB
        `);

        // Add notes column if missing (for existing databases)
        try {
            await conn.query(`ALTER TABLE items ADD COLUMN notes TEXT DEFAULT NULL`);
        } catch (_) { /* column already exists */ }

        await conn.query(`CREATE TABLE IF NOT EXISTS users (
            username VARCHAR(255) PRIMARY KEY,
            password VARCHAR(255) NOT NULL,
            isAdmin BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`);

        // Create admin and regular users if they don't exist
        const hashedAdminPassword = await bcrypt.hash('admin123', 10);
        const hashedUserPassword = await bcrypt.hash('user123', 10);

        // Check if users exist and create them if not
        const existingAdmin = await conn.query('SELECT username FROM users WHERE username = ?', ['admin']);
        if (existingAdmin.length === 0) {
            await conn.query('INSERT INTO users (username, password, isAdmin) VALUES (?, ?, ?)',
                ['admin', hashedAdminPassword, true]);
        }

        const existingUser = await conn.query('SELECT username FROM users WHERE username = ?', ['user']);
        if (existingUser.length === 0) {
            await conn.query('INSERT INTO users (username, password, isAdmin) VALUES (?, ?, ?)',
                ['user', hashedUserPassword, false]);
        }

        console.log('Database initialized with admin (admin/admin123) and user (user/user123) users');
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
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
          "SELECT id, name, date, bought_date, category, price, quantity, bought_by, created_by, archived, notes FROM items" :
          "SELECT id, name, date, bought_date, category, price, quantity, bought_by, created_by, archived, notes FROM items WHERE archived = 0";
        const rows = await conn.query(query);
        return rows;
    } finally {
        if (conn) conn.release();
    }
}

// Get filtered items by date range and category
async function getFilteredItems(startDate, endDate, category, includeArchived) {
    let conn;
    try {
        conn = await pool.getConnection();

        let query = "SELECT id, name, date, bought_date, category, price, quantity, bought_by, created_by, archived, notes FROM items";
        const params = [];
        const conditions = [];

        if (!includeArchived) {
            conditions.push("archived = 0");
        }

        if (startDate) {
            conditions.push("date >= ?");
            params.push(startDate);
        }

        if (endDate) {
            conditions.push("date <= ?");
            params.push(endDate);
        }

        if (category && category !== 'all') {
            conditions.push("category = ?");
            params.push(category);
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        const rows = await conn.query(query, params);
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

        const result = await conn.query(
            'INSERT INTO items (name, date, bought_date, category, price, quantity, created_by, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [item.name, item.date, item.bought_date, item.category, item.price, item.quantity, item.created_by, item.notes || null]
        );

        if (!result || !result.insertId) {
            throw new Error('Insert failed');
        }

        const [newItem] = await conn.query(
            'SELECT * FROM items WHERE id = ?',
            [result.insertId]
        );

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

// Un-buy an item (clear bought status)
async function unbuyItem(itemId) {
    let conn;
    try {
        conn = await pool.getConnection();
        const query = `UPDATE items SET bought_date = NULL, bought_by = NULL WHERE id = ?`;
        await conn.query(query, [itemId]);
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

// Un-archive an item (restore)
async function unarchiveItem(itemId) {
    let conn;
    try {
        conn = await pool.getConnection();
        const query = `UPDATE items SET archived = FALSE WHERE id = ?`;
        await conn.query(query, [itemId]);
    } finally {
        if (conn) conn.release();
    }
}

// Permanently delete an item from the database
async function deleteItem(itemId) {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.query(`DELETE FROM items WHERE id = ?`, [itemId]);
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
async function updateUser(username, password, isAdmin, newUsername) {
    let conn;
    try {
        conn = await pool.getConnection();

        let query;
        const params = [];

        if (newUsername && newUsername !== username) {
            // Rename user: update username + isAdmin + optionally password
            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                query = `UPDATE users SET username = ?, password = ?, isAdmin = ?, updated_at = NOW() WHERE username = ?`;
                params.push(newUsername, hashedPassword, isAdmin, username);
            } else {
                query = `UPDATE users SET username = ?, isAdmin = ?, updated_at = NOW() WHERE username = ?`;
                params.push(newUsername, isAdmin, username);
            }
        } else {
            if (password) {
                const hashedPassword = await bcrypt.hash(password, 10);
                query = `UPDATE users SET password = ?, isAdmin = ?, updated_at = NOW() WHERE username = ?`;
                params.push(hashedPassword, isAdmin, username);
            } else {
                query = `UPDATE users SET isAdmin = ?, updated_at = NOW() WHERE username = ?`;
                params.push(isAdmin, username);
            }
        }

        await conn.query(query, params);
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

// Update an item (full update)
async function updateItem(item) {
    let conn;
    try {
        conn = await pool.getConnection();
        const query = `
            UPDATE items
            SET name = ?, date = ?, bought_date = ?, category = ?, price = ?, quantity = ?, notes = ?
            WHERE id = ?
        `;
        await conn.query(query, [
            item.name,
            item.date,
            item.bought_date,
            item.category,
            item.price,
            item.quantity,
            item.notes || null,
            item.id
        ]);
    } catch (error) {
        console.error('Error updating item:', error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
}

// Get top N most frequently added items
async function getFrequentItems(limit = 10) {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query(`
            SELECT name, category, price, COUNT(*) AS freq
            FROM items
            GROUP BY name, category
            ORDER BY freq DESC, name ASC
            LIMIT ?
        `, [limit]);
        return rows;
    } finally {
        if (conn) conn.release();
    }
}

// Get a single item by ID
async function getItemById(itemId) {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query('SELECT * FROM items WHERE id = ?', [itemId]);
        return rows[0] || null;
    } finally {
        if (conn) conn.release();
    }
}

module.exports = {
    createTable,
    initializeDatabase,
    getItems,
    getFilteredItems,
    addItem,
    markAsBought,
    unbuyItem,
    archiveItem,
    unarchiveItem,
    deleteItem,
    authenticateUser,
    createUser,
    updateUser,
    deleteUser,
    getUsers,
    getUserByUsername,
    updateItem,
    getItemById,
    getFrequentItems
};
