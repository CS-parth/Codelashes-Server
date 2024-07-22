const mongoose = require('mongoose');
const Contest = require('./Contest');

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
        type: mongoose.Schema.Types.ObjectId,
        ref:'Contest'
    },
    status: {type:String,default:"UnAttempted"}
});

ProblemSchema.post('save', async function(doc) {
    try{
        // find the contest 
        const existingContest = await Contest.findById(doc.contest);
        existingContest.problems.push(doc._id);
        await existingContest.save();
    }catch(err){
        console.error(err);
    }
});

const Problem = mongoose.model('Problem',ProblemSchema);

module.exports = Problem;