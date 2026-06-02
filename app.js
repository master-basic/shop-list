require('dotenv').config(); // Load environment variables from .env file
const express = require('express'); // Import the express module
const bodyParser = require('body-parser'); // Import the body-parser module
const path = require('path'); // Import the path module
const cookieParser = require('cookie-parser'); // Import the cookie-parser module
const morgan = require('morgan'); // Import the morgan module
const fs = require('fs'); // Import the fs module
const db = require('./db'); // Import the db module
const moment = require('moment'); // Import moment library

const app = express(); // Create an express application
const PORT = process.env.PORT || 3000; // Set the port to 3000 or the value from the environment variable

// Create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' });

// Setup the logger
app.use(morgan('combined', { stream: accessLogStream }));

app.use(bodyParser.json()); // Use body-parser middleware to parse JSON requests
app.use(cookieParser()); // Use cookie-parser middleware to parse cookies
app.use(express.static('public')); // Serve static files from the 'public' directory

// Initialize the database when the server starts
db.initializeDatabase();

// Function to format date to SQL datetime format using moment.js
function formatDateToSQL(datetime) {
    if (!datetime) return null;
    
    // Try to parse as YYYY-MM-DD format first (for text input)
    if (typeof datetime === 'string' && datetime.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = datetime.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) {
            return date.toLocaleString('en-US', { 
                timeZone: 'UTC',
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit'
            }).replace(/\//g, '-').replace(',', '').replace(':', ':');
        }
    }
    
    // Try to parse as ISO datetime format
    const parsed = moment(datetime);
    if (!parsed.isValid()) {
        throw new Error('Invalid date format');
    }
    return parsed.format('YYYY-MM-DD HH:mm:ss');
}

// Route to get the shopping list
app.get('/api/items', async (req, res) => {
    const includeArchived = req.query.includeArchived === 'true'; // Check if archived items should be included
    const items = await db.getItems(includeArchived); // Get all items, optionally including archived items
    res.json(items); // Send the items as a JSON response
});

// Route to get items with date range and category filters
app.get('/api/items/filter', async (req, res) => {
    try {
        const includeArchived = req.query.includeArchived === 'true';
        
        let query = includeArchived ?
            "SELECT id, name, date, bought_date, category, price, quantity, bought_by, created_by FROM items" :
            "SELECT id, name, date, bought_date, category, price, quantity, bought_by, created_by FROM items WHERE archived = 0";
        
        const params = [];
        
        if (req.query.startDate) {
            query += " AND date >= ?";
            params.push(req.query.startDate);
        }
        
        if (req.query.endDate) {
            query += " AND date <= ?";
            params.push(req.query.endDate);
        }
        
        if (req.query.category && req.query.category !== 'all') {
            query += " AND category = ?";
            params.push(req.query.category);
        }
        
        const rows = await db.getItems(includeArchived); // Note: getItems doesn't support filters yet
        // For now, return all items and let frontend filter
        res.json(rows);
    } catch (error) {
        console.error('Error filtering items:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to add a new item to the list
app.post('/api/items', async (req, res) => {
    try {
        console.log('Received request body:', req.body);

        const { name, price, quantity, date, category } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Item name is required' });
        }

        const username = req.cookies.username;
        if (!username) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        // Use current time as the item creation date in SQL format
        const newItem = {
            name: name.trim(),
            date: formatDateToSQL(new Date()),
            bought_date: null, // Initialize as null (item not yet bought)
            category: category || null,
            price: parseFloat(price) || 0.00,
            quantity: parseInt(quantity) || 1,
            created_by: username
        };

        console.log('Creating item:', newItem);

        const addedItem = await db.addItem(newItem);
        
        if (!addedItem) {
            return res.status(500).json({ error: 'Failed to create item' });
        }

        console.log('Created item:', addedItem);
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

// Route to mark an item as bought
app.put('/api/items/:id/bought', async (req, res) => {
    const itemId = req.params.id; // Get the item ID from the request parameters
    const username = req.cookies.username; // Get the username from the cookies
    await db.markAsBought(itemId, username); // Mark the item as bought in the database
    res.json({ id: itemId, bought: true, bought_by: username }); // Send a JSON response indicating the item was marked as bought
});

// Add this new route after the route for marking an item as bought
app.put('/api/items/:id', async (req, res) => {
    try {
        const itemId = req.params.id;
        const { name, date, bought_date, price, quantity, category } = req.body;
        // Convert date fields to proper SQL format
        const formattedDate = formatDateToSQL(new Date(date));
        const formattedBoughtDate = bought_date ? formatDateToSQL(new Date(bought_date)) : null;
        const updatedItem = {
            id: itemId,
            name,
            date: formattedDate, // use formatted date
            bought_date: formattedBoughtDate, // use formatted bought_date
            category: category || null,
            price: parseFloat(price),
            quantity: parseInt(quantity)
        };
        await db.updateItem(updatedItem);
        res.json({ success: true, item: updatedItem });
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Route to delete an item from the list
app.delete('/api/items/:id', async (req, res) => {
    const itemId = req.params.id; // Get the item ID from the request parameters
    await db.archiveItem(itemId); // Archive the item in the database
    res.json({ id: itemId, archived: true }); // Send a JSON response indicating the item was archived
});

// Route to authenticate a user
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await db.authenticateUser(username, password);
    if (user) {
        res.cookie('username', username, { httpOnly: true });
        res.json({ success: true, isAdmin: user.isAdmin });
    } else {
        res.json({ success: false });
    }
});

// Route to log out a user
app.post('/api/logout', (req, res) => {
    res.clearCookie('username');
    res.json({ success: true });
});

// Route to get the current authenticated user
app.get('/api/current-user', async (req, res) => {
    const username = req.cookies.username;
    if (username) {
        // Use the new function that does not require a password
        const user = await db.getUserByUsername(username);
        res.json(user);
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

// Route to create a new user
app.post('/api/users', async (req, res) => {
    const { username, password, isAdmin } = req.body;
    await db.createUser(username, password, isAdmin);
    res.json({ success: true });
});

// Route to update a user's password and admin status
app.put('/api/users/:username', async (req, res) => {
    const username = req.params.username;
    const { password, isAdmin } = req.body;
    await db.updateUser(username, password, isAdmin);
    res.json({ success: true });
});

// Route to delete a user
app.delete('/api/users/:username', async (req, res) => {
    const username = req.params.username;
    await db.deleteUser(username);
    res.json({ success: true });
});

// Route to get all users
app.get('/api/users', async (req, res) => {
    const users = await db.getUsers();
    res.json(users);
});

// Route to get a specific user
app.get('/api/users/:username', async (req, res) => {
    const username = req.params.username;
    // Changed: Use getUserByUsername instead of authenticateUser with empty password
    const user = await db.getUserByUsername(username);
    res.json(user);
});

// Serve the index.html file - redirect to login
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

app.get('/report.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'report.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`); // Start the server and log the URL
});

