const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
    "name": {
        type: String
    },
    "setters" : [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    "startDate": String, // use moment to create date and time
    "startTime": String,
    "endDate": String,
    "duration": String,
    "convertedDate": Date,
    "problems": [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem'
    }],
    "description": String,
    "rules": String
});

const Contest = new mongoose.model('Contest',contestSchema);

module.exports = Contest;