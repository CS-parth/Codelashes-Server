const blockedContests = new Map();

function isSubmissionsBlocked(req, res){
    return new Promise((resolve,reject)=>{
      try{
        const { contest } = req.body; 
        if (blockedContests.has(contest)) {
          return reject({status:403,message:"Submissions are currently blocked for this contest"});
        }
        resolve();
      }catch(err){
        reject({status:500,message:"Internal Server Error"});
      }
    })
}

module.exports = {
  blockedContests,
  isSubmissionsBlocked
};