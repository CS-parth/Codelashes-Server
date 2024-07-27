const mongoose = require('mongoose');
const Problem = require('./Problem');
const editorialSchema = mongoose.Schema({
    language: String,
    code: String,
    solution: String,
    problem: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'Problem'
    }
});

editorialSchema.post('save',async function(doc){
    try{
        const problemId = doc.problem;
        await Problem.findByIdAndUpdate(problemId,{
            editorial:doc._id
        },{new:true});
    }catch(err){
        console.error(err);
    }
})

const Editorial = new mongoose.model('Editorial',editorialSchema);

module.exports = Editorial;