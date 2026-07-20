require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const fs = require('fs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' });

app.use(morgan('combined', { stream: accessLogStream }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

db.initializeDatabase();

app.use('/api/items', require('./routes/items'));
app.use('/api/users', require('./routes/users'));
app.use('/api', require('./routes/auth'));

app.get('/', (req, res) => {
    res.redirect('/login.html');
});

app.get('/report.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'report.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
