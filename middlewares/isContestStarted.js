const moment = require('moment');
const Contest = require('../models/Contest');

async function isContestStarted(req,res,next){
    const { id } = req.params;
    const existingContest = await Contest.findById(id);
    // console.log(existingContest);
    const contestStartTime = existingContest.startTime;
    // console.log(contestStartTime);
    if(moment().isBefore(contestStartTime)){
        return res.status(403).json({message: "Contest Not started Yet"});
    }
    next();
}   

module.exports = isContestStarted;