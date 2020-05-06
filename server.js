const express = require('express');
const connectDB = require('./config/db');
const colors = require('colors');

const app = express();

// Connect Database
connectDB();

// Init Middleware Body Parser
app.use(express.json({ extended: true }));

app.get('/', (req, res) => res.send('API Running'));

// Definig Routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running at port ${PORT}`.blue.underline));