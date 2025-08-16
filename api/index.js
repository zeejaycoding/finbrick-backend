require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
})
  .then(() => console.log('MongoDB Connected successfully'))
  .catch(err => console.error('MongoDB Connection Error:', err.message, 'from IP:', req?.headers['x-forwarded-for'] || 'Unknown'));

app.use('/api/users', require('../routes/userRoutes'));

app.get('/', (req, res) => res.send('Finbrick Backend API is running'));

module.exports = app;