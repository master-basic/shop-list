const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const EXPIRY = '7d';

function generateToken(username) {
    return jwt.sign({ username }, SECRET, { expiresIn: EXPIRY });
}

function verifyToken(token) {
    try {
        return jwt.verify(token, SECRET);
    } catch {
        return null;
    }
}

module.exports = { generateToken, verifyToken };
