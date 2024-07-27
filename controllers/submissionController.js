const Submission = require("../models/Submission");
const validation = require("../utils/Validation");
const Validation = new validation();
exports.getContestMySubmissions = async (req, res) => {
    try {
        const { username, contest } = req.params;
        // console.log(username);
        const mySubmissions = await Submission.find({ username: username, contest: contest })
        .sort({ createdAt: -1 });

        res.status(200).json(mySubmissions);
    } catch (err) {
        console.error('Error fetching submissions:', err);  // Provide more specific logging
        res.status(500).json({ "message": "Internal Server Error" });
    }
};


exports.getContestAllSubmissions = async (req,res) => {
    try{
        const { contest }  = req.params;
        const allSubmissions = await Submission.find({contest:contest})
        .sort({createdAt: -1});

        res.status(200).json(allSubmissions);

    }catch(err){
        console.error(err);
        res.status(500).json({"message": "Internal Server Error"});
    }
}

exports.getProfileSubmission = async (req,res) => {
    try{    
        const token = req.cookies.jwt;
        const user = await Validation.getUser(token);
        const profileSubmissions = await Submission.aggregate([
            {
              '$match': {
                'username': 'CSparth'
              }
            }, {
              '$sort': {
                'createdAt': -1
              }
            }, {
              '$lookup': {
                'from': 'problems', 
                'localField': 'problem', 
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
                'verdict': 1, 
                'createdAt': 1, 
                'pid': '$result._id',
                'cid': '$result.contest',
                'problemTitle': '$result.title'
              }
            }
          ]);
        res.status(200).json(profileSubmissions);
    }catch(err){
        console.error(err);
        res.status(500).json({message: "Internal Server Error"});
    }
}