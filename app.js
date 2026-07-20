require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' });

app.use(morgan('combined', { stream: accessLogStream }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

// Security headers (Helmet)
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Rate limiter for login endpoint
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many login attempts. Try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Initialize the database when the server starts
db.initializeDatabase();

// Middleware to require authentication (verifies user exists in DB)
async function requireAuth(req, res, next) {
    const username = req.cookies.username;
    if (!username) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const user = await db.getUserByUsername(username);
        if (!user) {
            return res.status(401).json({ error: 'Invalid session' });
        }
        req.username = username;
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth check error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Middleware to require admin privileges
async function requireAdmin(req, res, next) {
    const username = req.cookies.username;
    if (!username) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const user = await db.getUserByUsername(username);
        if (!user || !user.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        req.username = username;
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth check error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// Route to get the shopping list (with optional date/category filtering)
app.get('/api/items', async (req, res) => {
    try {
        const includeArchived = req.query.includeArchived === 'true';
        const { startDate, endDate, category } = req.query;

        // If filter params are provided, use the filter endpoint logic
        if (startDate || endDate || (category && category !== 'all')) {
            const rows = await db.getFilteredItems(startDate, endDate, category, includeArchived);
            return res.json(rows);
        }

        const items = await db.getItems(includeArchived);
        res.json(items);
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to add a new item to the list
app.post('/api/items', requireAuth, async (req, res) => {
    try {
        const { name, price, quantity, date, category } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Item name is required' });
        }

        // Use current time as the item creation date in SQL format
        const newItem = {
            name: name.trim(),
            date: new Date().toISOString().slice(0, 19).replace('T', ' '),
            bought_date: null,
            category: category || null,
            price: parseFloat(price) || 0.00,
            quantity: parseInt(quantity) || 1,
            created_by: req.username
        };

        const addedItem = await db.addItem(newItem);

        if (!addedItem) {
            return res.status(500).json({ error: 'Failed to create item' });
        }

        res.status(201).json({
            success: true,
            item: addedItem
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Route to mark an item as bought (or toggle if already bought)
app.put('/api/items/:id/bought', requireAuth, async (req, res) => {
    try {
        const itemId = req.params.id;
        const item = await db.getItemById(itemId);

        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // Toggle: if already bought, un-buy; otherwise mark as bought
        if (item.bought_date) {
            await db.unbuyItem(itemId);
            res.json({ id: itemId, bought: false, bought_by: null });
        } else {
            await db.markAsBought(itemId, req.username);
            res.json({ id: itemId, bought: true, bought_by: req.username });
        }
    } catch (error) {
        console.error('Error toggling bought status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to update an item (supports partial updates)
app.put('/api/items/:id', requireAuth, async (req, res) => {
    try {
        const itemId = req.params.id;

        // Fetch current item to allow partial updates
        const currentItem = await db.getItemById(itemId);
        if (!currentItem) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // Merge provided fields with current values
        const updatedItem = {
            id: itemId,
            name: req.body.name !== undefined ? req.body.name : currentItem.name,
            date: req.body.date !== undefined ? req.body.date : currentItem.date,
            bought_date: req.body.bought_date !== undefined ? req.body.bought_date : currentItem.bought_date,
            category: req.body.category !== undefined ? req.body.category : currentItem.category,
            price: req.body.price !== undefined ? parseFloat(req.body.price) : parseFloat(currentItem.price),
            quantity: req.body.quantity !== undefined ? parseInt(req.body.quantity) : parseInt(currentItem.quantity)
        };

        await db.updateItem(updatedItem);
        res.json({ success: true, item: updatedItem });
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to delete (archive) an item from the list
app.delete('/api/items/:id', requireAuth, async (req, res) => {
    try {
        const itemId = req.params.id;
        await db.archiveItem(itemId);
        res.json({ id: itemId, archived: true });
    } catch (error) {
        console.error('Error archiving item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to un-archive (restore) an item
app.put('/api/items/:id/restore', requireAuth, async (req, res) => {
    try {
        const itemId = req.params.id;
        await db.unarchiveItem(itemId);
        res.json({ id: itemId, archived: false });
    } catch (error) {
        console.error('Error restoring item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to authenticate a user
app.post('/api/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await db.authenticateUser(username, password);
        if (user) {
            res.cookie('username', username, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax'
            });
            res.json({ success: true, isAdmin: user.isAdmin });
        } else {
            res.json({ success: false });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to log out a user
app.post('/api/logout', (req, res) => {
    res.clearCookie('username', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
    });
    res.json({ success: true });
});

// Route to get the current authenticated user
app.get('/api/current-user', async (req, res) => {
    try {
        const username = req.cookies.username;
        if (username) {
            const user = await db.getUserByUsername(username);
            res.json(user);
        } else {
            res.status(401).json({ error: 'Not authenticated' });
        }
    } catch (error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to get all users (admin only)
app.get('/api/users', requireAdmin, async (req, res) => {
    try {
        const users = await db.getUsers();
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to get a specific user (admin only)
app.get('/api/users/:username', requireAdmin, async (req, res) => {
    try {
        const username = req.params.username;
        const user = await db.getUserByUsername(username);
        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to create a new user (admin only)
app.post('/api/users', requireAdmin, async (req, res) => {
    try {
        const { username, password, isAdmin } = req.body;
        await db.createUser(username, password, isAdmin);
        res.json({ success: true });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

// Route to update a user's password, admin status, and optionally rename (admin only)
app.put('/api/users/:username', requireAdmin, async (req, res) => {
    try {
        const username = req.params.username;
        const { password, isAdmin } = req.body;
        const newUsername = req.body.newUsername || req.body.username || null;
        await db.updateUser(username, password, isAdmin, newUsername);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to delete a user (admin only)
app.delete('/api/users/:username', requireAdmin, async (req, res) => {
    try {
        const username = req.params.username;
        await db.deleteUser(username);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve the index.html file - redirect to login
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

app.get('/report.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'report.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
