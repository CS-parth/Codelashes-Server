const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require("../models/User");
const Lead = require("../models/Lead");
const CoLead = require("../models/CoLead");
const ProblemSetter = require("../models/ProblemSetter");
const Participant = require("../models/Participant");

exports.Signin =  (req, res) => {
    const { username , email , password } = req.body;
    console.log(username);
    User.findOne({ email })
      .then(user => {

        if (!user) {
          return res.status(404).json({ message: 'Email not found' });
        }

        bcrypt.compare(password, user.password)
          .then(isMatch => {
            if (isMatch) {

              const payload = {
                id: user._id,
              };
  
              jwt.sign(
                payload, process.env.SECRET_KEY, { expiresIn: 3600*24*30 },
                (err,token) => {
                  res.status(200).cookie('jwt', token, {
                    path: "/",
                    maxAge: 3 * 24 * 60 * 60 * 1000,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'Lax',
                    domain: process.env.NODE_ENV === 'production' ? `${process.env.COOKIE_DOMAIN}` : 'localhost'
                  }).json({
                    id: user._id,
                    success: true
                  });
                }
              );
            } else {
              return res.status(400).json({ message: 'Password incorrect' });
            }
          });
      });
}

exports.Signup = (req,res) => {
  const { username, email, password, role } = req.body;

  // Check if the user already exists
  User.findOne({ email })
    .then(user => {
      if (user) {
        return res.status(400).json({ email: 'Email already exists' });
      } else {
        // Creating new RoleBased User
        let newUser;
        if(role == "lead" || role == "colead" || role == "problemsetter"){
          return res.status(403).json({message: "똑똑하지 마십시오"})
        }
        if(role == process.env.LEAD){
          newUser = new Lead({username,email,password,role});
        }else if(role == process.env.COLEAD){
          newUser = new CoLead({username,email,password,role});
        }else if(role == process.env.PROBLEM_SETTER){
          newUser = new ProblemSetter({username,email,password,role});
        }else{
          newUser = new Participant({username,email,password,role:"participant"});
        }
        // Hash the password before saving
        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;

            newUser.save()
              .then(user => {
                const payload = {
                  id: user.id,
                };
                jwt.sign(
                  payload, process.env.SECRET_KEY, { expiresIn: 3600*24*30 },
                  (err,token) => {
                      res.cookie('jwt', token, {
                        path: "/",
                        maxAge: 3 * 24 * 60 * 60 * 1000,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'Lax',
                        domain: process.env.NODE_ENV === 'production' ? `${process.env.COOKIE_DOMAIN}` : 'localhost'
                      });
                      
                      res.status(200).json({
                        id: newUser._id,
                        success: true
                      });
                  }
                );
              })
              .catch(err => console.log(err));
          });
        });
      }
    });
} 

exports.Logout = (req,res)=>{
  try{
    const cookieOptions = {
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? `${process.env.COOKIE_DOMAIN}` : 'localhost',
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'Lax',
    };
    // CS~> For Oauth2
    req.logout((err)=>{
      if(err) throw new Error(err.message);
      res.clearCookie('connect.sid',cookieOptions);
      // CS~> For personal Auth
      res.clearCookie('jwt',cookieOptions);
      res.status(200).json({message: "Cookies removed"});
    })
  }catch(err){
    console.error(err);
    res.status(500).json({message: "Internal Server Errror"});
  }
}

exports.getUser = (req,res) => {
  console.log(req.session);
  console.log(req.user);
  if(req.user){
    // console.log(req.user);
    res.status(200).json({success:true,user: req.user});
  }else{
    res.status(200).json({success:false,user:null});
  }
}

exports.googleAuthCallback = async (req, res) => {
  try {
    if (!req.user) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=no_user_data`);
    }

    const payload = {
      id: req.user._id,
    };

    jwt.sign(
      payload,
      process.env.SECRET_KEY,
      { expiresIn: 3600 * 24 * 30 },
      (err, token) => {
        if (err) {
          console.error('JWT Sign Error:', err);
          return res.redirect(`${process.env.CLIENT_URL}/login?error=token_generation_failed`);
        }

        res.cookie('jwt', token, {
          path: "/",
          maxAge: 3 * 24 * 60 * 60 * 1000,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'Lax',
          domain: process.env.NODE_ENV === 'production' ? `${process.env.COOKIE_DOMAIN}` : 'localhost'
        });

        res.redirect(`${process.env.CLIENT_URL}`);
      }
    );
  } catch (error) {
    console.error('Google Auth Callback Error:', error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=callback_failed`);
  }
};