const mongoose = require('mongoose');

const ProblemSchema = new mongoose.Schema({
    problemStatement : {
        type: String,
        required: true
    },
    constraints : {
        type: String,
        required: true
    },
    input : {
        type: String,
        required: true
    },
    output : {
        type: String,
        required: true
    },
    sampleTestcase : {
        type: String,
        required: true
    },
    time : {
        type: String,
        required: true
    },
    memory : {
        type: String,
        required: true
    },
    title : {
        type: String,
        required: true
    },
    acceptance : {
        type: Number,
    },
    difficulty : {
        type: Number,
        required: true
    },
    contest: {
        type: mongoose.Types.ObjectId,
        ref:'Contest'
    }
});

const Problem = mongoose.model('Problem',ProblemSchema);

module.exports = Problem;