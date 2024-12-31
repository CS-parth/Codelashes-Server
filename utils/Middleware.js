class Middleware{
    constructor(){}
    
    getOR(middlewareArr){
        return async (req,res,next)=>{ // async as we have to handle promises inside this func
            let lstError = "Internal Server Error";
            let lstSatus = 500;
            for(let idx = 0;idx < middlewareArr.length;idx++){
                try{
                    console.log("Executing : ", middlewareArr[idx]);
                    await middlewareArr[idx](req,res,next);
                    // console.log("Done");
                    return next();
                }catch(error){
                    console.log(error);
                    lstError = error.message;
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
                    return res.status(error.status || 500).json({message:error.message || "Internal Server Error"});
                }
            }
            // If we never gets err
            return next();
        }
    }

    getAndPromise(middlewareArr){
        return async (req,res)=>{
            for(let idx = 0;idx < middlewareArr.length;idx++){
                try{
                    await middlewareArr[idx](req,res);
                    continue;
                }catch(error){
                    return Promise.reject({status:error.status || 500,message:error.message || "Internal Server Error"});
                }
            }
            // If we never gets err
            return Promise.resolve();
        }
    }

    single(middleware){
        return async (req,res,next)=>{
            try{
                await middleware(req,res);
                next();
            }catch(error){
                return res.status(error.status || 500).json({message:error.message || "Internal Server Error"});
            }
        }
    }
    // Conditional
}

module.exports = Middleware;