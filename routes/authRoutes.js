const express = require('express');
const router = express.Router();
const authControllers = require('../controllers/authControllers');
const passport = require('passport');
require('../config/passport');(passport)


router.post('/signup', authControllers.SignupController);

// Route for user login
router.post('/signin',authControllers.SigninController);
//passport.authenticate('jwt', { session: false })
router.get('/user',passport.authenticate('jwt',{session: false}),authControllers.getUser);
module.exports = router;