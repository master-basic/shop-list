const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const db = require('../db');
const { validate, loginSchema } = require('../middleware/validate');
const { generateToken } = require('../middleware/jwt');
const { getUsername } = require('../middleware/auth');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { error: 'Too many login attempts. Try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false
});

router.post('/login', loginLimiter, validate(loginSchema), async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await db.authenticateUser(username, password);
        if (user) {
            const token = generateToken(username);
            res.cookie('token', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'lax',
                maxAge: 7 * 24 * 60 * 60 * 1000
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

router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
    });
    res.json({ success: true });
});

router.get('/current-user', async (req, res) => {
    try {
        const username = getUsername(req);
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

module.exports = router;
