const ProblemSetter = require("../models/ProblemSetter");
const validation = require("../utils/Validation");
const Validation = new validation();
const User = require("../models/User");
exports.getSetters = async (req,res)=>{
    try{
        const allSetters = await ProblemSetter.find({},'username');
        console.log(allSetters);
        if(!allSetters){
            return res.status(401).json({message: "No Setters Available"});
        }
        res.status(203).send(allSetters);
    }catch(err){
        console.log(err);
        res.status(500).json({message: "Internal Server Error"});
    }
}

exports.getRating = async (req,res) => {
    try{
        const {username} = req.query;
        const ratingsData = await User.findOne({username:username},'rating');
        res.status(200).json(ratingsData);
    }catch(err){
        console.error(err);
        res.status(500).json({message: "Internal Server Error"});
    }
}

exports.getAuth = async (req,res)=>{
    try{
        const token = req.cookies.jwt;
        if(token == null){
            return res.status(204).json({authenticated: false,authorized: false});
        }
        console.log(token);
        const role = await Validation.getRole(token);
        console.log(role);
        if(role == process.env.LEAD || role == process.env.COLEAD || role == process.env.PROBLEM_SETTER){
            console.log("lead");
            return res.status(200).json({authenticated: true,authorized: true});
        }else if(role == "participant"){
            return res.status(200).json({authenticated: true,authorized: false});
        }else{
            return res.status(200).json({authenticated: false,authorized: false});
        }
    }catch(err){
        console.error(err);
        res.status(500).json({message: "Internal Server Error"});
    }
}