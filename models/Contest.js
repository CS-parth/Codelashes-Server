const mongoose = require('mongoose');

const contestSchema = new mongoose.Schema({
    "name": {
        type: String
    },
    "setters" : [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    "date": String,
    "startTime": String,
    "duration": String,
    "problems": [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem'
    }]
});

const Contest = new mongoose.model('Contest',contestSchema);

module.exports = Contest;