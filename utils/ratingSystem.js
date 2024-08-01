const mongoose = require('mongoose');
const moment = require('moment');
const Submission = require("../models/Submission");
const Contest = require('../models/Contest');
const Problem = require('../models/Problem');
const User = require('../models/User');
const {blockedContests}= require("../middlewares/isSubmissionsBlocked");

class ratingSystem{
  constructor(){};
  
  async getDistinctUsernamesForContest(contestId) {
    try {
      const distinctUsernames = await Submission.aggregate([
        {
          '$match': {
            'contest': new mongoose.Types.ObjectId(contestId)
          }
        }, {
          '$group': {
            '_id': '$username'
          }
        }, {
          '$project': {
            'username': 1
          }
        }
      ]);
      // console.log(distinctUsernames);
      return distinctUsernames.map(doc => doc._id);
    } catch (error) {
      console.error('Error fetching distinct usernames:', error);
    }
  }
  
  blockSubmissions(contestId) {
    blockedContests.set(contestId, true);
    for(let [key,value] of blockedContests){
      console.log(key);
    }
  }
  
  unblockSubmissions(contestId) {
    blockedContests.delete(contestId);
    for(let [key,value] of blockedContests){
      console.log(key);
    }
  }

  async getSubmissions(contestId,participant) {
    const submissions = await Submission.aggregate([
      {
        '$match': {
          'contest': new mongoose.Types.ObjectId(contestId), 
          'isRated': true, 
          'username': participant
        }
      }, {
        '$sort': {
          'createdAt': 1
        }
      }, {
        '$group': {
          '_id': '$problem', 
          'submissions': {
            '$push': '$$ROOT'
          }
        }
      }, {
        '$project': {
          'submissions': {
            '$let': {
              'vars': {
                'acceptedIndex': {
                  '$indexOfArray': [
                    {
                      '$map': {
                        'input': '$submissions', 
                        'as': 'sub', 
                        'in': '$$sub.verdict'
                      }
                    }, 'Accepted'
                  ]
                }
              }, 
              'in': {
                '$cond': {
                  'if': {
                    '$gte': [
                      '$$acceptedIndex', 0
                    ]
                  }, 
                  'then': {
                    '$slice': [
                      '$submissions', {
                        '$add': [
                          '$$acceptedIndex', 1
                        ]
                      }
                    ]
                  }, 
                  'else': '$submissions'
                }
              }
            }
          }
        }
      }, {
        '$unwind': '$submissions'
      }, {
        '$replaceRoot': {
          'newRoot': '$submissions'
        }
      }, {
        '$sort': {
          'createdAt': 1
        }
      }
    ]);
    return submissions;
  }

  async getPerformaceMesure(contest,participant,submissions){
        console.log(submissions);
        let PerformanceMeasure = 0;
        let Times = new Map();
        let isAccepted = new Map();
        for (let j = 0; j < submissions.length; j++) {
          const submission = submissions[j];
          const problem = submission.problem.toString(); // every object is differently referenced even having the same value so convert it so string for comparitions
        
          if (!Times.has(problem)) { // has use Same-Value-Zero Algorithim
            Times.set(problem, 0);
          }
        
          let t = Times.get(problem);
        
          if (submission.verdict === "Accepted") {
            isAccepted.set(problem,true);
            const time = moment(submission.createdAt, "ddd MMM DD YYYY HH:mm:ss GMT+HHMM").diff(moment(contest.startDate, "ddd MMM DD YYYY HH:mm:ss GMT+HHMM"), 'seconds');
            console.log(time);
            t += time;
            console.log(`Accepted Submission. Time added: ${time}. New Total Time for problem ${problem}: ${t}`);
          } else {
            t += 600; 
            console.log(`Wrong Submission. Penalty added: 5 min. New Total Time for problem ${problem}: ${t}`);
          }
          
          Times.set(problem, t);  
        }
        for(let j = 0;j < submissions.length;j++){
          const submission = submissions[j];
          const problem = submission.problem.toString();
          if(!isAccepted.has(problem)) {
            Times.delete(problem);
          }
        }
        for (let [problem, time] of Times) {
          console.log(`Problem: ${problem}, Total Time: ${time}`);
        }
        for (let [problem, time] of Times) {
          const p = await Problem.findById(problem);
          console.log("time",Times.get(problem));
          PerformanceMeasure += (p.difficulty/time);
        }
        console.log("Returning", PerformanceMeasure);
        return PerformanceMeasure;
  }

  async getActualRanking(contestId){ // returning a Map of Rating
    const contest = await Contest.findById(contestId);
    const allParticipants = await this.getDistinctUsernamesForContest(contestId);
    let Performance = new Map();
    // console.log(allParticipants);
    for(let idx = 0;idx < allParticipants.length;idx++){
      const participant = allParticipants[idx];
        if(participant){
          console.log(participant);
          const submissions = await this.getSubmissions(contestId,participant);
          // console.log("Submission ",submissions);
          let PerformanceMeasure = await this.getPerformaceMesure(contest,participant,submissions);
          Performance.set(participant,PerformanceMeasure);  
        }
     }

     const sortedPerformance = new Map([...Performance.entries()].sort((a, b) => b[1] - a[1])); // for actual Rank

     let ActualRank = new Map();
     
     let rank = 0;
     let prevValue = -1;
     for (let [key, value] of sortedPerformance) {
        if(value !== prevValue){
            rank++;
            prevValue = value;
        }
        ActualRank.set(key,rank);
     }

     return ActualRank;
  }

  async getExpectedRanking(contestId){ // returning a Map of Rating
    const allParticipants = await this.getDistinctUsernamesForContest(contestId);
    let Rating = new Map();
    
    for(let idx = 0;idx < allParticipants.length;idx++){
      const participant = allParticipants[idx];
      if(participant){
        const user = await User.find({username:participant});
        Rating.set(participant,user.rating | 0);
      }
    }

     const sortedRating = new Map([...Rating.entries()].sort((a, b) => b[1] - a[1])); // for expected Rank

     let ExpectedRank = new Map();
      
      let rank = 0;
      let prevValue = -1;
      for (let [key, value] of sortedRating) {
        if(prevValue !== value) {
          rank++;
          prevValue = value;
        }
        ExpectedRank.set(key,rank);
      }
      
      return ExpectedRank;
  }

  async calculateRatings(contestId) {
    
    const allParticipants = await this.getDistinctUsernamesForContest(contestId);

    let ExpectedRank = await this.getExpectedRanking(contestId);
    let ActualRank = await this.getActualRanking(contestId);

    let deltaRating = new Map();
    let K = 10;
    
    for(let j = 0;j < allParticipants.length;j++){
      const participant = allParticipants[j];
      if(participant){
        console.log(K*(ExpectedRank.get(participant) - ActualRank.get(participant)));
        deltaRating.set(participant,K*(ExpectedRank.get(participant) - ActualRank.get(participant) + 1));
      }
    }
    
    console.log(deltaRating);
    // update Ratings 
    for (const participant of allParticipants) {
      try {
        const user = await User.findOne({ username: participant });
        console.log(user);
        if (user && deltaRating.has(participant)) {
          if(user.rating === undefined) user.rating = [];
          const currentRating = (user.rating.length != 0) ? user.rating[user.rating.length-1] : 0;
          user.rating.push(currentRating + deltaRating.get(participant));
          user.markModified("rating");
          await user.save();
        }
      } catch (error) {
        console.error(`Error updating rating for user ${participant}:`, error);
      }
    }
    
    // console.log(Rating);
  
    this.unblockSubmissions(contestId);
  }

  async getLeaderBoard(contestId) {
    const allParticipants = await this.getDistinctUsernamesForContest(contestId);
    const LeaderBoard = [];
    const ActualRanking = await this.getActualRanking(contestId);
    const contest = await Contest.findById(contestId,'problems');
                                //  .populate('problems');
    const problemNumber = new Map();
    const problemObj = {};
    
    for (let i = 0; i < contest.problems.length; i++) {
      const problem = contest.problems[i].toString();
      problemNumber.set(problem, i);
      
      const letterKey = String.fromCharCode("A".charCodeAt(0) + i);
      problemObj[letterKey] = false;
    }
    const problems = contest.problem;
    for(let i = 0;i < allParticipants.length;i++){
      const participant = allParticipants[i];
      let obj = {
        ...problemObj,
        username: participant,
        ranking: ActualRanking.get(participant)
      }
      // obj.problem = true for all the accepted solution with israted flag
      const acceptedSubmissions = await Submission.find({username:participant,isRated:true,verdict:"Accepted",contest:contestId});
      for(let i = 0;i < acceptedSubmissions.length;i++){
          const problem = acceptedSubmissions[i].problem.toString();
          const idx = problemNumber.get(problem);
          const letterKey = String.fromCharCode("A".charCodeAt(0) + idx);
          obj[letterKey] = true;
      }
      LeaderBoard.push(obj);
    }
    return LeaderBoard;
  }
}

module.exports = ratingSystem;