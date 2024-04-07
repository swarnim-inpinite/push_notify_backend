const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true // Ensure uniqueness of email
  },
  password: {
    type: String,
    required: true
  },
  uid: {
    type: String,
    required: true,
    unique: true // Ensure uniqueness of uid
  },
  pushNotificationToken: {
    type: String,
    default: null // Initialize with null, update with token when available
  }
});

module.exports = mongoose.model('User', userSchema);
