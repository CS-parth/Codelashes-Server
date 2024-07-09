const Contest = require('../models/Contest');

exports.createContest = async (req,res)=>{
    try{
        const {name,setters,date,time,duration,problems} = req.body;
        const newContest = new Contest({name,setters,date,time,duration,problems});
        await newContest.save();
        res.status(200).json({"message": `Contest created successfully with id : ${newContest._id}`});
    }catch(err){
        console.error(err);
        res.status(500).json({"message": "Internal Server Error"});
    }
}

exports.getContest = async (req, res) => {
    try {
        const id = req.params.id;
        
        if (!id) {
            return res.status(400).json({ message: "Invalid Contest ID" });
        }

        const existingContest = await Contest.findById(id)
                                             .populate('setters')
                                             .populate('problems');
        
        if (!existingContest) {
            return res.status(404).json({ message: "Contest does not exist" });
        }
        
        res.status(200).json(existingContest);
    } catch (error) {
        console.error('Error retrieving Contest:', error);
        res.status(500).json({ message: "Internal server error" });
    }
}

exports.getContestList = async (req, res) => {
    try {
        const allContests = await Contest.find({});
        
        if (!allContests) {
            return res.status(404).json({ message: "No Contests to pesent" });
        }
        
        res.status(200).json(allContests);
    } catch (error) {
        console.error('Error retrieving Contest:', error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// const schedule = require('node-schedule');
// const moment = require('moment');
// const io = require('socket.io')(server);

// // Example contest data
// const contests = [
//   { contestId: '1', startTime: '2024-07-09T12:00:00Z', duration: 120 }, // Duration in minutes
// ];

// function startContest(contestId) {
//   io.emit('contestStarted', { contestId });
//   console.log(`Contest ${contestId} started`);
// }

// function endContest(contestId) {
//   io.emit('contestEnded', { contestId });
//   console.log(`Contest ${contestId} ended`);
//   calculateRatings(contestId);
// }

// function ratingCalculationComplete(contestId) {
//   io.emit('ratingCalculationComplete', { contestId });
//   console.log(`Rating calculation for contest ${contestId} completed`);
// }

// function calculateRatings(contestId) {
//   // Simulate rating calculation delay
//   setTimeout(() => {
//     ratingCalculationComplete(contestId);
//   }, 10000); // 10 seconds for demo purposes
// }

// // Schedule the events
// contests.forEach(contest => {
//   const start = moment(contest.startTime);
//   const end = start.clone().add(contest.duration, 'minutes');

//   schedule.scheduleJob(start.toDate(), () => startContest(contest.contestId));
//   schedule.scheduleJob(end.toDate(), () => endContest(contest.contestId));
// });
