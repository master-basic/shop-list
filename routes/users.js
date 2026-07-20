const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAdmin } = require('../middleware/auth');

router.get('/', requireAdmin, async (req, res) => {
    try {
        const users = await db.getUsers();
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:username', requireAdmin, async (req, res) => {
    try {
        const username = req.params.username;
        const user = await db.getUserByUsername(username);
        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', requireAdmin, async (req, res) => {
    try {
        const { username, password, isAdmin } = req.body;
        await db.createUser(username, password, isAdmin);
        res.json({ success: true });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

router.put('/:username', requireAdmin, async (req, res) => {
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

router.delete('/:username', requireAdmin, async (req, res) => {
    try {
        const username = req.params.username;
        await db.deleteUser(username);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
