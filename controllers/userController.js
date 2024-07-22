const ProblemSetter = require("../models/ProblemSetter");

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