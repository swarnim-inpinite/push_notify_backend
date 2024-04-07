const mongoose = require("mongoose")

const connectDB = async () => {
    try {
      await mongoose.connect("mongodb+srv://swarnimdhawane:BO1jtuSydBbUKw9B@push-notification.frfuajh.mongodb.net/?retryWrites=true&w=majority&appName=push-notification", {

      });
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('MongoDB connection error:', error);
    }
  };
  
  module.exports = connectDB;