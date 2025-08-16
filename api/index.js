require('dotenv').config();
const express=require('express');
const mongoose=require('mongoose');
const cors=require('cors');

const app=express();
app.use(cors());
app.use(express.json());

//db connection
mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));

app.use('/api/users', require('../routes/userRoutes'));

module.exports = app;