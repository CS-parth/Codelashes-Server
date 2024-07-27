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
        default: 0
    },
    difficulty : {
        type: Number,
        required: true
    },
    contest: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'Contest'
    },
    setter: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'User'
    },
    editorial: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'Editorial'
    },
    status: {type:String,default:"Unattempted"}
});

ProblemSchema.post('save', async function(doc,next) {
    try{
        // find the contest 
        const existingContest = await Contest.findById(doc.contest);
        if(existingContest.problems.includes(doc._id)){
            next();
        }
        existingContest.problems.push(doc._id);
        await existingContest.save();
        next();
    }catch(err){
        console.error(err);
    }
});

ProblemSchema.pre("findOneAndDelete", async function(next) {
    try{
        console.log(this._conditions._id);
        const contest = await Contest.findOneAndUpdate({
            problems: this._conditions._id
        },{ 
            $pull: {'problems': this._conditions._id}
        },
        {new:true});
        console.log(contest);
        next();
    }catch(err){
        console.error(err);
    }
  });

const Problem = mongoose.model('Problem',ProblemSchema);

module.exports = Problem;