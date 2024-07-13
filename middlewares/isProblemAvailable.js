const Problem = require("../models/Problem");
const moment = require("moment");
async function isProblemAvailable(req,res,next){
    const {id} = req.params;
    const existingProblem = await Problem.findById(id)
                                         .populate("contest");
    if(moment().isBefore(existingProblem.contest.startTime)){
        return res.status(403).json({message: "Problem is not available yet"});
    }
    next();
}

module.exports = isProblemAvailable;