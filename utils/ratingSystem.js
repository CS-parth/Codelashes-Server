
function calculateRatings(contestId) {
  blockSubmissions(contestId);
  async function getDistinctUsernamesForContest(contestId) {
    try {
      const distinctUsernames = await Submission.aggregate([
        { $match: { contest: mongoose.Types.ObjectId(contestId) } },
        { $group: { _id: '$username' } },
        { $project: { _id: 0, username: 1 } }
      ]);
  
      return distinctUsernames.map(doc => doc.username);
    } catch (error) {
      console.error('Error fetching distinct usernames:', error);
    }
  }

  const allParticipants = getDistinctUsernamesForContest(contestId); // get all the participants that have participated in contest (ie : alteast one submission in the contest)
  
  // Perform rating calculations
  
  unblockSubmissions(contestId);
}

function blockSubmissions(contestId) {
  // Logic to block submissions
}

function unblockSubmissions(contestId) {
  // Logic to unblock submissions
}
