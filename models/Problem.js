const mongoose = require('mongoose');

const ProblemSchema = new mongoose.Schema({
    problemStatement : {
        type: String,
        required: true
    },
    Constraints : {
        
    },
    Input : {

    },
    Output : {

    },
    sampleTestcase : {
        
    },
    time : {
        type: String,
        required: true
    },
    memory : {
        type: String,
        required: true
    }
});

const Problem = mongoose.model('Problem',ProblemSchema);

module.exports = Problem;