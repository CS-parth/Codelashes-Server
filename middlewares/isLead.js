const validation = require("../utils/Validation");
const Validation = new validation();

const isLead = (req,res) => {
    return new Promise(async (resolve,reject)=>{
        try{
            const User = await Validation.getUser(req.cookies.jwt);
            if(User === null){
                return reject({status: 400, err: "User not found"});
            }
            if(User.role == process.env.LEAD){
                resolve();
            }else{
                return reject({status:403,err: "Unautharized User"});
            }
        }catch(err){
            return reject({status:500,err:"Internal Server Error"});
        }
    })
}

module.exports = isLead;