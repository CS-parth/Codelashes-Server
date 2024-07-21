const moment = require('moment');
const Contest = require('../models/Contest');

function isContestStarted(req, res) {
  return new Promise(async (resolve, reject) => {
    try {
      const { id } = req.params;
      const existingContest = await Contest.findById(id);
      if (!existingContest) {
        return reject({ status: 404, message: "Contest not found" });
      }

      const [hours, minutes] = existingContest.startTime.split(':').map(Number);
      const contestStartTime = moment(existingContest.startDate,"ddd MMM DD YYYY HH:mm:ss Z+HHmm").set({ hours, minutes, seconds: 0 });

      if (moment().isBefore(moment(contestStartTime))) {
        return reject({ status: 403, message: "Contest not started yet" });
      }
      return resolve();
    } catch (error) {
      console.error(error);
      return reject({ status: 500, message: "Internal Server Error" });
    }
  });
}

module.exports = isContestStarted;
