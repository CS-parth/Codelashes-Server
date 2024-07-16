const mongoose = require('mongoose');
const User = require('./User');

const problemSetterSchema = new mongoose.Schema({
    problems:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem'
    }]
});

const ProblemSetter = User.discriminator("ProblemSetter",problemSetterSchema);

module.exports = ProblemSetter;