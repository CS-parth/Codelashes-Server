const Submission = require("../models/Submission");

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