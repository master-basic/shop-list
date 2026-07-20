const crypto = require('crypto');

const COOKIE_NAME = 'csrf-token';
const HEADER_NAME = 'x-csrf-token';

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

function csrfCookie(req, res, next) {
    if (!req.cookies[COOKIE_NAME]) {
        const token = generateToken();
        res.cookie(COOKIE_NAME, token, {
            httpOnly: false,
            secure: false,
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });
    }
    next();
}

function csrfProtect(req, res, next) {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
        return next();
    }
    const cookieToken = req.cookies[COOKIE_NAME];
    const headerToken = req.headers[HEADER_NAME];
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return res.status(403).json({ error: 'Invalid CSRF token' });
    }
    next();
}

module.exports = { csrfCookie, csrfProtect };