const Contest = require('../models/Contest');
const mongoose = require('mongoose');
const schedule = require('node-schedule');
const moment = require('moment');
const { emitMessage } = require('../utils/socket-io');
const calculateRatings = require("../utils/ratingSystem");
exports.createContest = async (req,res)=>{
    try{
        const {name,setters,startDate,startTime,duration,description,rules} = req.body;
        const newContest = new Contest();
        newContest.name = name;
        newContest.setters = setters.map((id)=>new mongoose.Types.ObjectId(id));
        const [hours,minutes] = startTime.split(':').map(Number);
        newContest.startDate = moment(startDate).set({hours,minutes,seconds:0});
        newContest.startTime = startTime;
        newContest.duration = duration;
        const [durationHours, durationMinutes] = duration.split(':').map(Number);
        newContest.endDate = moment(newContest.startDate,"ddd MMM DD YYYY HH:mm:ss Z+HHmm").add(durationHours, 'hours').add(durationMinutes, 'minutes');
        newContest.description = description;
        newContest.rules = rules;
        
        await newContest.save();

        // scheduling events for the contestStart and contestEnd
        schedule.scheduleJob(moment(newContest.startDate,"ddd MMM DD YYYY HH:mm:ss Z+HHmm").toDate(), () => startContest(newContest._id));
        schedule.scheduleJob(moment(newContest.endDate,"ddd MMM DD YYYY HH:mm:ss Z+HHmm").toDate(), () => endContest(newContest._id));

        res.status(200).json({
                            message: `Contest created successfully with id : ${newContest._id}`,
                            id:`${newContest._id}`});
    }catch(err){
        console.error(err);
        res.status(500).json({"message": "Internal Server Error"});
    }
}

exports.getContest = async (req, res) => {
    try {
        const id = req.params.id;
        // console.log(id);
        if (!id) {
            return res.status(400).json({ message: "Invalid Contest ID" });
        }

        const existingContest = await Contest.findById(id)
                                             .populate('setters')
                                             .populate('problems');
        
        if (!existingContest) {
            return res.status(404).json({ message: "Contest does not exist" });
        }
        // console.log(existingContest);
        res.status(200).json(existingContest);
    } catch (error) {
        console.error('Error retrieving Contest:', error);
        res.status(500).json({ message: "Internal server error" });
    }
}

exports.getContestList = async (req, res) => {
    try {
        const allContests = await Contest.find({})
                                         .populate({
                                            path: 'setters',
                                            select:'username'
                                         });
        
        if (!allContests) {
            return res.status(404).json({ message: "No Contests to pesent" });
        }
        
        res.status(200).json(allContests);
    } catch (error) {
        console.error('Error retrieving Contest:', error);
        res.status(500).json({ message: "Internal server error" });
    }
}

exports.getContestMeta = async (req,res) => {
    try {
        const { id } = req.params;
        const existingContest = await Contest.findById(id,'name setters startDate startTime endDate duration')
                                             .populate("setters");

        if(!existingContest) {
            return res.status(404).json({message: "Contest does not exists"});
        }

        res.status(200).json(existingContest);
    } catch(err) {
        console.error(err);
        res.status(500).json({message: "Internal Server Error"});
    }
}


// const io = require('socket.io')(server);

// // Example contest data
// const contests = [
//   { contestId: '1', startTime: '2024-07-09T12:00:00Z', duration: 120 }, // Duration in minutes
// ];

function startContest(contestId) {
  emitMessage('contestStarted', { contestId });
  console.log(`Contest ${contestId} started`);
}

function endContest(contestId) {
  emitMessage('contestEnded', { contestId });
  console.log(`Contest ${contestId} ended`);
  calculateRatings(contestId);
}

// function ratingCalculationComplete(contestId) {
//   io.emit('ratingCalculationComplete', { contestId });
//   console.log(`Rating calculation for contest ${contestId} completed`);
// }

// // Schedule the events
// contests.forEach(contest => {
//   const start = moment(contest.startTime);
//   const end = start.clone().add(contest.duration, 'minutes');

//   schedule.scheduleJob(start.toDate(), () => startContest(contest.contestId));
//   schedule.scheduleJob(end.toDate(), () => endContest(contest.contestId));
// });
