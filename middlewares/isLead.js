const validation = require("../utils/Validation");
const Validation = new validation();

const isLead = async (req,res,next) => {
    const User = await Validation.getUser(req.cookies.jwt);
    if(User === null){
        return res.status(400).json({message: "User not found"});
    }
    if(User.role == process.env.LEAD){
        next();
    }else{
        return res.status(403).json({message: "Unautharized User"});
    }
}

module.exports = isLead;