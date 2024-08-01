const Contest = require('../models/Contest');
const User = require('../models/User');
const mongoose = require('mongoose');
const schedule = require('node-schedule');
const moment = require('moment');
const { emitMessage } = require('../utils/socket-io');
const ratingSystem = require("../utils/ratingSystem");
const validation = require('../utils/Validation');
const Submission = require('../models/Submission');
const Validation = new validation();
const RatingSystem = new ratingSystem();

exports.createContest = async (req,res)=>{
    try{
        const {name,setters,startDate,startTime,duration,description,rules} = req.body;
        const newContest = new Contest();
        newContest.name = name;
        newContest.setters = setters.map((id)=>new mongoose.Types.ObjectId(id));
        const [hours,minutes] = startTime.split(':').map(Number);
        console.log(startDate);
        newContest.startDate = moment(startDate).set({hours,minutes,seconds:0});
        newContest.startTime = startTime;
        newContest.duration = duration;
        const contestStartDate = moment(newContest.startDate,"ddd MMM DD YYYY HH:mm:ss GMT+HHMM");
        const [durationHours, durationMinutes] = duration.split(':').map(Number);
        newContest.endDate = contestStartDate.add(durationHours, 'hours').add(durationMinutes, 'minutes');
        const contestEndDate = moment(newContest.endDate,"ddd MMM DD YYYY HH:mm:ss GMT+HHMM");
        newContest.description = description;
        newContest.rules = rules;
        newContest.convertedDate = contestStartDate.toDate();
        await newContest.save();

        // scheduling events for the contestStart and contestEnd
        schedule.scheduleJob(contestStartDate.toDate(), () => startContest(newContest._id));
        schedule.scheduleJob(contestEndDate.toDate(), () => endContest(newContest._id));

        res.status(200).json({
                            message: `Contest created successfully with id : ${newContest._id}`,
                            id:`${newContest._id}`});
    }catch(err){
        console.error(err);
        res.status(500).json({"message": "Internal Server Error"});
    }
}

exports.editContest = async (req,res)=>{
    try{
        const {id} = req.params;
        let {name,setters,startDate,startTime,duration,description,rules} = req.body;
        const [hours,minutes] = startTime.split(':').map(Number);
        startDate = moment(startDate).set({hours,minutes,seconds:0}).format("ddd MMM DD YYYY HH:mm:ss GMT+HHMM");
        const [durationHours, durationMinutes] = duration.split(':').map(Number);
        endDate = moment(startDate,"ddd MMM DD YYYY HH:mm:ss GMT+HHMM").add(durationHours, 'hours').add(durationMinutes, 'minutes');
        const updatedContest = await Contest.findByIdAndUpdate(id,{
                name,
                setters,
                startDate,
                startTime,
                duration,
                description,
                rules
            },{ new: true, runValidators: true }
        )
        const {problems} = req.body;
        // update the order
        let newOrderProblemSet = [];
        for(let i = 0;i < problems.length;i++){
            newOrderProblemSet[problems[i]] = updatedContest.problems[i];
        }
        await Contest.findByIdAndUpdate(id,{
            problems:newOrderProblemSet
        },{new:true,runValidators:true})
        res.status(200).json({message: `Contest Updated with id ${id}`});
    }catch(err){
        console.error(err);
        res.status(500).json({message:"Internal Server Error"});
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
                                         })
                                         .sort({convertedDate: -1});
        
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

exports.getManagable = async (req,res) => {
    try{
        const { username } = req.query;
        console.log(username);
        const user = await User.findOne({username:username});
        // array objects 
        // obj = {index,contestName,setters}
        const allContests = await Contest.find({})
                                         .populate('setters');
        let managableContests = allContests.map((contest,index)=>{
                                                    return {
                                                        _id:contest._id,
                                                        index:index,
                                                        title:contest.name,
                                                        setters:contest.setters.map((obj)=>obj.username)
                                                    }
                                                });
        // console.log(user.role);
        if(user.role == process.env.LEAD){
            return res.status(200).json(managableContests);
        }else if(user.role === process.env.COLEAD){
            return res.status(200).json(managableContests);
        }else{
            managableContests = managableContests.filter((contest)=>contest.setters.includes(username));
            return res.status(200).json(managableContests);
        }
    }catch(err){
        console.log(err);
        res.status(500).json({message: "Internal Server Error"});
    }
}

exports.getProfileContest = async (req,res) => {
    try{
        const {username} = req.query;
        const user = await User.findOne({username:username},'rating');
        // console.log(user);
        const contestsByOrder = await Submission.aggregate([
            {
              '$match': {
                'username': `${username}`
              }
            }, {
              '$group': {
                '_id': '$contest'
              }
            }, {
              '$lookup': {
                'from': 'contests', 
                'localField': '_id', 
                'foreignField': '_id', 
                'as': 'result'
              }
            }, {
              '$unwind': {
                'path': '$result'
              }
            }, {
              '$project': {
                '_id': 1, 
                'startTime': '$result.startTime',
                'startDate': '$result.startDate',
                'name': '$result.name',
                'convertedDate': '$result.convertedDate'
              }
            }, {
              '$sort': {
                'convertedDate': -1
              }
            }
        ]);
        const size = user.rating.length - 1;
        const profileContests = contestsByOrder.map((contest,index)=>({
            ...contest,
            rating:user.rating[size-index]-(user.rating[size-index-1] || 0)
        }))
        res.status(200).json(profileContests);
    }catch(err){
        console.error(err);
        res.status(500).json({message: "Internal Server Error"});
    }
}

function startContest(contestId) {
  emitMessage('contestStarted', { contestId });
  console.log(`Contest ${contestId} started`);
}

function endContest(contestId) {
  emitMessage('contestEnded', { contestId });
  console.log(`Contest ${contestId} ended`);
  RatingSystem.calculateRatings(contestId);
}