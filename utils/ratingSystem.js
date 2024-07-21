const mongoose = require('mongoose');
const moment = require('moment');
const Submission = require("../models/Submission");
const Contest = require('../models/Contest');
const Problem = require('../models/Problem');
const User = require('../models/User');
const {blockedContests}= require("../middlewares/isSubmissionsBlocked");

async function calculateRatings(contestId) {
  
  const contest = await Contest.findById(contestId);
  const [hour,minute] = contest.duration.split(":").map(Number);
  const contestDuration = hour*60*60 + minute*60;
  blockSubmissions(contestId);
 
  async function getDistinctUsernamesForContest(contestId) {
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

  const allParticipants = await getDistinctUsernamesForContest(contestId); // get all the participants that have participated in contest (ie : alteast one submission in the contest)
  
  console.log("Different Participants ", allParticipants);

  let Performance = new Map();
  
  for(let idx = 0;idx < allParticipants.length;idx++){
    const participant = allParticipants[idx];
      if(participant){
        console.log(participant);
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
        // console.log("Submission ",submissions);
        let PerformanceMeasure = 0;
        let Times = new Map();
        let isAccepted = new Map();
        for (let j = 0; j < submissions.length; j++) {
          const submission = submissions[j];
          const problem = submission.problem.toString(); // every object is differently referenced even having the same value so convert it so string for comparitions
        
          // console.log(`Submission #${j}: `, submission);
        
          if (!Times.has(problem)) { // has use Same-Value-Zero Algorithim
            Times.set(problem, 0);
          }
        
          let t = Times.get(problem);
        
          if (submission.verdict === "Accepted") {
            isAccepted.set(problem,true);
            const time = moment(submission.createdAt, "ddd MMM DD YYYY HH:mm:ss Z+HHmm")
              .diff(moment(contest.startDate, "ddd MMM DD YYYY HH:mm:ss Z+HHmm"), 'seconds');
            t += time;
            console.log(`Accepted Submission. Time added: ${time}. New Total Time for problem ${problem}: ${t}`);
          } else {
            t += 100; 
            console.log(`Wrong Submission. Penalty added: 20. New Total Time for problem ${problem}: ${t}`);
          }
          
          Times.set(problem, t);  
        }
        // For those who did not submitted the correct answer add the contest Time to it
        for(let j = 0;j < submissions.length;j++){
          const submission = submissions[j];
          const problem = submission.problem.toString();
          if(!isAccepted.has(problem)) {
            // console.log(problem + "Do not have any Accepted Solution");
            let t = Times.get(problem);
            t += contestDuration;
            Times.set(problem,t);
          }
        }
        for (let [problem, time] of Times) {
          console.log(`Problem: ${problem}, Total Time: ${time}`);
        }
        for (let [problem, time] of Times) {
          const p = await Problem.findById(problem);
          console.log("time",Times.get(problem));
          PerformanceMeasure += (p.difficulty/time);
          // console.log(PerformanceMeasure);
        }
        Performance.set(participant,PerformanceMeasure);  
      }
   }
  
  
  console.log(Performance);

  let Rating = new Map();
  
  for(let idx = 0;idx < allParticipants.length;idx++){
    const participant = allParticipants[idx];
    if(participant){
      const user = await User.find({username:participant});
      Rating.set(participant,user.rating | 0);
    }
  }

  
  const sortedPerformance = new Map([...Performance.entries()].sort((a, b) => b[1] - a[1])); // for actual Rank
  const sortedRating = new Map([...Rating.entries()].sort((a, b) => b[1] - a[1])); // for expected Rank
  

  let ExpectedRank = new Map();
  let ActualRank = new Map();
  
  let rank = 1;
  for (let [key, value] of sortedPerformance) {
    ActualRank[key] = rank++;
  }
  console.log("ActualRank",ActualRank);
  rank = 1;
  for (let [key, value] of sortedRating) {
    ExpectedRank[key] = rank++;
  }
  console.log("ExpectedRank",ExpectedRank);
  let deltaRating = new Map();
  let K = 10;
  
  for(let j = 0;j < allParticipants.length;j++){
    const participant = allParticipants[j];
    if(participant){
      deltaRating[participant] = K*(ActualRank[participant] - ExpectedRank[participant]);
    }
  }
  
  // update Ratings 
  for(let j = 0;j < allParticipants.length;j++){
    const participant = allParticipants[j];
    const user = await User.find({username:participant})[0];
    // user = user[0];
    if(user){
      // console.log(deltaRating[participant]);
      if(deltaRating[participant]){
        user.rating += deltaRating[participant];
      }
      user.markModified("rating");
      await user.save();
    }
  }
  
  console.log(Rating);

  unblockSubmissions(contestId);
}

function blockSubmissions(contestId) {
  blockedContests.set(contestId, true);
  for(let [key,value] of blockedContests){
    console.log(key);
  }
}

function unblockSubmissions(contestId) {
  blockedContests.delete(contestId);
  for(let [key,value] of blockedContests){
    console.log(key);
  }
}

module.exports = calculateRatings;
// calculateRatings("668bce473136ded82a520040");