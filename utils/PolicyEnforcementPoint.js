const validation = require('./Validation');
const rbacPolicyDecisionPoint = require('./rbacPolicyDecisionPoint.js');
const abacPolicyDecisionPoint = require('./abacPolicyDecisionPoint.js');
const Validation = new validation();
const rbacPDP = new rbacPolicyDecisionPoint();
const abacPDP = new abacPolicyDecisionPoint();
const Contest = require('../models/Contest');
const Problem = require('../models/Problem');
const User = require("../models/User");

class Middleware{
    execute(req,res,next){
        throw new Error('Method not implemented');
    }
}

class RBACMiddleware extends Middleware {
    
    execute(permission) {
        return async (req, res, next) => {
            try{
              console.log(req.cookies.jwt);
              const User = await Validation.getUser(req.cookies.jwt);
              req.user = User;
              if (!req.cookies || !req.cookies.jwt) {
                  return Promise.reject({status:403,message:"JWT token not found"});
              }
              const userRole = req.user ? req.user.role : 'anonymous';
              if (userRole !== 'anonymous') {
                  req.permission = permission;
                  req.middleware = "rbac";
                  return Promise.resolve();
              } else {
                  return Promise.reject({status: 403,message: "Access denied"});
              }
            }catch(err){
              console.error(err);
              return Promise.reject({status: 500,message: "Internal Server Error"});
            }
        };
    }
    
 }


 class ABACMiddleware extends Middleware {
    execute(permission,resourse) {
      return async (req,res,next) =>{
        try{
          if(resourse == 'user'){
            req.asset = await User.findById(req.body.user);
          }else if(resourse == 'contest'){
            req.asset = await Contest.findById(req.body.contest);
          }else if(resourse == 'problem'){
            req.asset = await Problem.findById(req.body.problem);
          }else{
            console.error("Bad request {check permission}");
          }
          const User = await Validation.getUser(req.cookies.jwt);
          req.user = User;
          if (!req.cookies || !req.cookies.jwt) {
              return Promise.reject({status: 403,message: "JWT token not found"});
          }
          const userRole = req.user ? req.user.role : 'anonymous';
          if (userRole !== 'anonymous') {
            req.resourse = resourse;
            req.permission = permission;
            req.middleware = "abac";
            return Promise.resolve();
          } else {
            return Promise.reject({status: 403,message:"Access denied"});
          }
        }catch(err){
          return Promise.reject({status:500,message:"Internal Server Error"});
        }
      }
    }
  }


  class EthicalWallPolicy extends Middleware {
    execute(permission) {
      return async (req, res, next) => {
        try {
          const data = permission.split('_');
          
          req.permission = data[0];
          req.resourse = data[1];

          if (!req.cookies || !req.cookies.jwt) {
            return Promise.reject({ status: 403, message: 'JWT token not found' });
          }
          
         const User = await Validation.getUser(req.cookies.jwt);
          req.user = User;
            
          const userRole = req.user ? req.user.role : 'anonymous';
          
          if (userRole !== 'anonymous') {
            req.middleware = "ethicalWall";
            return Promise.resolve();
          } else {
            return Promise.reject({ status: 403, message: 'Access denied' });
          }
        } catch (error) {
          return Promise.reject({ status: 500, message: 'Internal server error' });
        }

      };
    }
  }

  class PDP {
    static async execute(req, res, next) {
      try {
        if (req.middleware === 'rbac') {
          const userPermissions = rbacPDP.getPermissionsByRoleName(Validation.parseRole(req.user.role));
          if (userPermissions.includes(req.permission)) {
            return Promise.resolve();
          } else {
            return Promise.reject({ status: 403, message: 'Access denied' });
          }
        } else if (req.middleware === 'abac') {
          // create conditional set
          const conditionalSet = {
            user: {
              attributes: {
                ...(req.user.role && { role: Validation.parseRole(req.user.role) })
              }
            },
            ...(req.permission && { action: req.permission }),
            resourse: {
              ...(req.resourse && { type: req.resourse }),
              attributes: {
                ...(req.asset?.isBanned === true && { isBanned: req.asset?.isBanned })
              }
            }
          };
          if (abacPDP.isAllowed(conditionalSet)) {
            return Promise.resolve();
          } else {
            return Promise.reject({ status: 403, message: 'Access denied' });
          }
        } else if (req.middleware === 'ethicalWall') {
          // req.permission and req.resourse
          const permission = req.permission;
          const resourse = req.resourse;
          if(resourse == "submission" && permission == "create"){
             // req.contest and req.problem req.cookies.jwt
             const decodedToken = await Validation.getPayload(req.cookies.jwt);
             const contest = await Contest.findById(req.body.contest,'setters');
             // check if user if there or not in the problemSetters
             console.log(contest);
             if(contest.setters.includes(decodedToken.id)){
              return Promise.reject({status: 403,message: "Access Denied"});
             }else{
               console.log("resolved");
               return Promise.resolve();
             }
          }else if(resourse == "problem" && (permission == "delete" || permission == "update")){
            // req.params is problemID adn req.cookies.jwt is token
            const token = req.cookies.jwt;
            const { id } = req.params;
            const decodedToken = await Validation.getPayload(token);
            const problemAuthor = await Problem.findById(id,'setter');
            if(decodedToken.id == problemAuthor.setter){
              return Promise.resolve();
            }else{
              return Promise.reject({status: 403,message: "Access Denied"});
            }
          }
          return Promise.reject({status: 401,message: "Invalid request"});
        } else {
          return Promise.reject({ status: 400, message: "Using anonymous policy" });
        }
      } catch (error) {
        return Promise.reject({ status: 500, message: 'Internal server error' });
      }
    }
  }

  class PEP {
    constructor(middleware) {
      this.middleware = middleware;
    }
  
    execute(req, res, next) {
      this.middleware.execute(req, res, next);
    }
  }


  module.exports = {
    PEP,
    RBACMiddleware,
    ABACMiddleware,
    EthicalWallPolicy,
    PDP
  };

