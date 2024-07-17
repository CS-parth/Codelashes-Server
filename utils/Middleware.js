class Middleware{
    constructor(){}
    getOR(middlewareArr){
        return async (req,res,next)=>{ // async as we have to handle promises inside this func
            let lstError = null;
            let lstSatus = 500;
            for(let idx = 0;idx < middlewareArr.length;idx++){
                try{
                    await middlewareArr[idx](req,res);
                    return next();
                }catch(error){
                    lstError = error.err;
                    lstSatus = error.status;
                }
            }
            // If never gets next() command
            return res.status(lstSatus).json({message: lstError});
        }
    }
    getAnd(middlewareArr){
        return async (req,res,next)=>{
            for(let idx = 0;idx < middlewareArr.length;idx++){
                try{
                    await middlewareArr[idx](req,res);
                    continue;
                }catch(error){
                    return res.status(error.status || 500).json({message:error.status || "Internal Server Error"});
                }
            }
            // If we never gets err
            return next();
        }
    }
    single(middleware){
        return async (req,res,next)=>{
            try{
                await middleware(req,res);
                next();
            }catch(error){
                return res.status(error.status || 500).json({message:error.status || "Internal Server Error"});
            }
        }
    }
    // Conditional
}

module.exports = Middleware;