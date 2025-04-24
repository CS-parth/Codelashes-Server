const express = require('express');
const router = express.Router();
const authControllers = require('../controllers/authControllers');
const passport = require('passport');
const middleware = require("../utils/Middleware");
const Middleware = new middleware();
require('../config/passport');(passport)
const jwt = require('jsonwebtoken');

// Local auth routes
router.post('/signup', authControllers.Signup);
router.post('/signin', authControllers.Signin);
router.post('/logout', authControllers.Logout);
router.get('/user', passport.authenticate('jwt'), authControllers.getUser);

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
    scope: ['email', 'profile']
}));

router.get('/google/callback', 
    passport.authenticate('google', { 
        failureRedirect: '/auth/google/failure',
        session: true
    }),
    authControllers.googleAuthCallback
);

router.get('/google/failure', (req, res) => {
    res.redirect(`${process.env.CLIENT_URL}/login?error=google_auth_failed`);
});

module.exports = router;