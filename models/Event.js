const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    description: { type: String, required: true }
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
