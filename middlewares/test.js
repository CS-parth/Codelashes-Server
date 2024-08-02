function testing(req,res,next){
    console.log(req.cookies);
    next();
}
module.exports = testing;