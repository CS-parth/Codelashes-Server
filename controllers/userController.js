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
        const token = req.cookies.jwt;
        const decodedToken = await Validation.getPayload(token);
        const ratingsData = await User.findById(decodedToken.id,'rating');
        res.status(200).json(ratingsData);
    }catch(err){
        console.error(err);
        res.status(500).json({message: "Internal Server Error"});
    }
}