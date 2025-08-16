require('dotenv').config();
const express=require('express');
const mongoose=require('mongoose');
const cors=require('cors');

const app=express();
app.use(cors());
app.use(express.json());

//db connection
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
  autoReconnect: true,
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err.message));

  
app.use('/api/users', require('../routes/userRoutes'));

module.exports = app;