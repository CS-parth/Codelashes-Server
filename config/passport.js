const passport = require('passport');
const JwtStrategy = require('passport-jwt').Strategy;
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require("../models/User");
const Participant = require('../models/Participant');
const ProblemSetter = require('../models/ProblemSetter');
const CoLead = require('../models/CoLead');
const Lead = require('../models/Lead');
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

passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.SERVER_URL}/api/auth/google/callback`
    },
    async function(token, tokenSecret, profile, done) {
      // testing
      console.log('===== GOOGLE PROFILE =======')
      console.log(profile)
      console.log('======== END ===========')
      // code
      const { id, name, photos } = profile;
      try{
        const existingUser = await User.findOne({ 'googleId': id });
        // if there is already someone with that googleId
        if (existingUser) {
          return done(null, existingUser)
        } else {
          // if no user in our db, create a new user with that googleId
          console.log('====== PRE SAVE =======')
          console.log(id)
          console.log(profile)
          console.log('====== post save ....')
          // Creating new RoleBased User
          let newGoogleUser;
          const role = "participant";
          if(role == "lead" || role == "colead" || role == "problemsetter"){
            return res.status(403).json({message: "똑똑하지 마십시오"})
          }
          const googleId = id;
          const username = profile.email.split('@')[0];
          if(role == process.env.LEAD){
            newGoogleUser = new Lead({googleID: googleId,username,role});
          }else if(role == process.env.COLEAD){
            newGoogleUser = new CoLead({googleID: googleId,username,role});
          }else if(role == process.env.PROBLEM_SETTER){
            newGoogleUser = new ProblemSetter({googleID: googleId,username,role});
          }else{
            newGoogleUser = new Participant({googleID: googleId,username,role:"participant"});
          }
          // save this user
          const savedUser = await newGoogleUser.save();
          return done(null, savedUser)
        }
      }catch(err){
          console.log(err)
          return done(null, false)
      }
    }
));

passport.serializeUser((user, done) => {
  console.log("Serializing user with id : ", user);
  done(null, user._id);
});

passport.deserializeUser(async (_id, done) => {
  console.log("Deserialising User with id : ",_id);
  try {
      const user = await User.findById(_id);
      done(null, user);
  } catch (err) {
      done(err, null);
  }
});