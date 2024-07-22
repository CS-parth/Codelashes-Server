const validation = require("../utils/Validation");
const Validation = new validation();

const isCoLead = (req,res) => {
    return new Promise(async (resolve,reject)=>{
        try{
            const User = await Validation.getUser(req.cookies.jwt);
            if(User === null){
                return reject({status: 400,message: "User not found"});
            }
            if(User.role == process.env.COLEAD){
                resolve();
            }else{
                return reject({status: 400,message: "Unautharized User"});
            }
        }catch(err){
            return reject({status:400,message:"Internal Server Error"});
        }
    })
}

module.exports = isCoLead;