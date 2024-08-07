const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require("../models/User");
const opts = {}
const cookieExtractor = req => {
  let jwt = null 

  if (req && req.cookies) {
      jwt = req.cookies['jwt']
  }

  return jwt
}
opts.jwtFromRequest = cookieExtractor;
opts.secretOrKey = process.env.SECRET_KEY;


passport.use(new JwtStrategy(opts,(jwt_payload,done)=>{
    User.findById(jwt_payload.id)
        .then(user => {
          if (user) {
            return done(null, user);
          }
          return done(null, false);
        })
        .catch(err => console.error(err));
}))