const Problem = require("../models/Problem");
const moment = require("moment");

async function isProblemAvailable(req, res) {
  return new Promise(async (resolve, reject) => {
    try {
      let { id } = req.params;
      if(!id){
        id = req.body.problem;
      }
      if(!id){
        throw new Error("No Problem Avaiable");
      }
      const existingProblem = await Problem.findById(id).populate("contest");
      if (!existingProblem) {
        return reject({ status: 404, message: "Problem not found" });
      }
      const contestStartTime = moment(existingProblem.contest.startTime,"ddd MMM DD YYYY HH:mm:ss Z"); 
      if (moment().isBefore()) {
        return reject({ status: 403, message: "Problem is not available yet"});
      }
      return resolve();
    } catch (error) {
      console.error(error);
      return reject({ status: 500, message: "Internal Server Error" });
    }
  });
}

module.exports = isProblemAvailable;
