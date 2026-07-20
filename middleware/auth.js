const db = require('../db');

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

module.exports = { requireAuth, requireAdmin };
