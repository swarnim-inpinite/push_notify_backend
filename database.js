const mongoose = require("mongoose")
// Load environment variables from .env file
require('dotenv').config();

const connectDB = async () => {
    try {
      mongoose.connect(process.env.MONGODB_URI, {
      });
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('MongoDB connection error:', error);
    }
  };
  
  module.exports = connectDB;