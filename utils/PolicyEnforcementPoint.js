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
              const User = await Validation.getUser(req.cookies.jwt);
              req.user = User;
              if (!req.cookies || !req.cookies.jwt) {
                  return Promise.reject({status:403,err:"JWT token not found"});
              }
              const userRole = req.user ? req.user.role : 'anonymous';
              if (userRole !== 'anonymous') {
                  req.permission = permission;
                  req.middleware = "rbac";
                  return Promise.resolve();
              } else {
                  return Promise.reject({status: 403,err: "Access denied"});
              }
            }catch(err){
              Promise.reject({status: 500,err: "Internal Server Error"});
            }
        };
    }
    
 }


 class ABACMiddleware extends Middleware {
    execute(permission,resourse) {
      return async (req,res,next) =>{
        try{
          if(resourse == 'user'){
            req.asset = await User.findById(req.body.resourse);
          }else if(resourse == 'contest'){
            req.asset = await Contest.findById(req.body.resourse);
          }else if(resourse == 'problem'){
            req.asset = await Problem.findById(req.body.resourse);
          }else{
            console.error("Bad request {check permission}");
          }
          const User = await Validation.getUser(req.cookies.jwt);
          req.user = User;
          if (!req.cookies || !req.cookies.jwt) {
              return Promise.reject({status: 403,err: "JWT token not found"});
          }
          const userRole = req.user ? req.user.role : 'anonymous';
          if (userRole !== 'anonymous') {
            req.resourse = resourse;
            req.permission = permission;
            req.middleware = "abac";
            return Promise.resolve();
          } else {
            return Promise.reject({status: 403,err:"Access denied"});
          }
        }catch(err){
          return Promise.reject({status:500,err:"Internal Server Error"});
        }
      }
    }
  }


  class ethicalWallPolicy extends Middleware {
    execute(permission) {
      return async (req, res, next) => {
        try {
          const data = permission.split('_');
          req.permission = data[0];
          req.resourse = data[1];
          
          if (!req.cookies || !req.cookies.jwt) {
            return Promise.reject({ status: 403, err: 'JWT token not found' });
          }
  
          const User = await Validation.getUser(req.cookies.jwt);
          req.user = User;
          
          const userRole = req.user ? req.user.role : 'anonymous';
          
          if (userRole !== 'anonymous') {
            req.middleware = "ethicalWall";
            return Promise.resolve();
          } else {
            return Promise.reject({ status: 403, err: 'Access denied' });
          }
        } catch (error) {
          return Promise.reject({ status: 500, err: 'Internal server error' });
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
            return Promise.reject({ status: 403, err: 'Access denied' });
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
            return Promise.reject({ status: 403, err: 'Access denied' });
          }
        } else if (req.middleware === 'ethicalWall') {
          // WIll think about this in future
          return Promise.resolve();
        } else {
          return Promise.reject({ status: 400, err: "Using anonymous policy" });
        }
      } catch (error) {
        return Promise.reject({ status: 500, err: 'Internal server error' });
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
    ethicalWallPolicy,
    PDP
  };

