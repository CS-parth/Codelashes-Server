const express = require('express');
const router = express.Router();
const authControllers = require('../controllers/authControllers');
const passport = require('passport');
require('../config/passport');(passport)


router.post('/signup', authControllers.Signup);

// Route for user login
router.post('/signin',authControllers.Signin);
router.post('/logout',authControllers.Logout);
router.get('/user',passport.authenticate('jwt',{session: false}),authControllers.getUser);
module.exports = router;