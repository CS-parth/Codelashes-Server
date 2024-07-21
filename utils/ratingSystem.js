const mongoose = require('mongoose');
const Submission = require("../models/Submission");
const Contest = require('../models/Contest');
const Problem = require('../models/Problem');
const User = require('../models/User');
const {blockedContests}= require("../middlewares/isSubmissionsBlocked");

async function calculateRatings(contestId) {
  
  const contest = await Contest.findById(contestId);

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
  
  let Performance = new Map();
  
  allParticipants.forEach(async (participant)=>{
    if(participant){
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
      let PerformanceMeasure = 0;
      let Times = new Map();
      submissions.forEach((submission)=>{
        const problem = submission.problem;
        if(submission.verdict == "Accepted"){
            const time = submission.createdAt-Contest.startTime;
            let t = Times.get(problem);
            t += time;
            Times.set(problem,t);
        }else{
          let t = Times.get(problem);
          t += 20;
          Times.set(problem,t);
        }
      })
      for (let [problem, time] of Times) {
        const p = await Problem.findById(problem);
        PerformanceMeasure += (problem.difficulty/time);
        Performance.set(problem,PerformanceMeasure);  
      }
    }
  })
  
  let Rating = new Map();
  
  allParticipants.forEach(async (participant)=>{
    if(participant){
      const user = await User.find({username:participant});
      Rating.set(participant,user.rating);
    }
  })

  const sortedPerformance = new Map([...Performance.entries()].sort((a, b) => b[1] - a[1])); // for expected RAnk
  const sortedRating = new Map([...Rating.entries()].sort((a, b) => b[1] - a[1])); // for actual Rank

  let ExpectedRank = new Map();
  let ActuaRank = new Map();
  
  let rank = 1;
  for (let [key, value] of sortedPerformance) {
      ExpectedRank[key] = rank++;
  }
  rank = 1;
  for (let [key, value] of sortedRating) {
    ActuaRank[key] = rank++;
  }
 
  let deltaRating = new Map();
  let K = 10;
  
  allParticipants.forEach((participant)=>{
    if(participant){
      deltaRating[participant] = K*(ActuaRank[participant] - ExpectedRank[participant]);
    }
  })
 
  // update Ratings 
  allParticipants.forEach(async (participant)=>{
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
  })
  
  unblockSubmissions(contestId);
}

function blockSubmissions(contestId) {
  blockedContests.set(contestId, true);
  // console.log("in");
  for(let [key,value] of blockedContests){
    console.log(key);
  }
}

function unblockSubmissions(contestId) {
  blockedContests.delete(contestId);
  // console.log("out");
  for(let [key,value] of blockedContests){
    console.log(key);
  }
}

module.exports = calculateRatings;
// calculateRatings("668bce473136ded82a520040");