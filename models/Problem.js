const mongoose = require('mongoose');

const ProblemSchema = new mongoose.Schema({
    problemStatement : {
        type: String,
        required: true
    },
    Constraints : {
        type: String,
        required: true
    },
    Input : {
        type: String,
        required: true
    },
    Output : {
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
        type: String,
        required: true
    },
    difficulty : {
        type: Number,
        required: true
    },
    contest: {
        type: mongoose.Types.ObjectId,
        ref:'Contest',
        required: true
    }
});

const Problem = mongoose.model('Problem',ProblemSchema);

module.exports = Problem;