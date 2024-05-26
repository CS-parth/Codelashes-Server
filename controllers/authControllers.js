const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require("../models/User");

exports.SigninController =  (req, res) => {
    const {username , email , password } = req.body;

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
                  res.json({
                    success: true,
                    token: token
                  });
                }
              );
            } else {
              return res.status(400).json({ message: 'Password incorrect' });
            }
          });
      });
}

exports.SignupController = (req,res) => {
  console.log(req.body);
  const { username, email, password } = req.body;

  // Check if the user already exists
  User.findOne({ email })
    .then(user => {
      if (user) {
        return res.status(400).json({ email: 'Email already exists' });
      } else {
        const newUser = new User({username,email,password});

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
                    res.json({
                      success: true,
                      token: token
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

exports.getUser = (req,res) => {
  res.json({success:true,user: req.user});
}