const blockedContests = new Map();

function isSubmissionsBlocked(req, res, next) {
    const { contest } = req.body; 
    if (blockedContests.has(contest)) {
      return res.status(403).json({ message: 'Submissions are currently blocked for this contest.' });
    }
    next();
}

module.exports = {
  blockedContests,
  isSubmissionsBlocked
};