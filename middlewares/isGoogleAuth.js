function isGoogleAuth(req,res,next){
    return new Promise((resolve,reject)=>{
        if (req.isAuthenticated()) {
            return resolve();
        } else {
            return reject({status: 403,message: "User Unauthorized"});
        }
    })
}

module.exports = isGoogleAuth;