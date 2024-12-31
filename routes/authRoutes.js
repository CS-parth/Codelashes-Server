const express = require('express');
const router = express.Router();
const authControllers = require('../controllers/authControllers');
const passport = require('passport');
const httpProxy = require('http-proxy');
const proxy = httpProxy.createServer({});
const middleware = require("../utils/Middleware");
const Middleware = new middleware();
require('../config/passport');(passport)
const passportAuth = require("../middlewares/passportAuth");
const isGoogleAuth = require("../middlewares/isGoogleAuth");
const jwt = require('jsonwebtoken');
// console.log(passport.authenticate());
router.post('/signup', authControllers.Signup);
router.post('/signin',authControllers.Signin);
router.post('/logout',authControllers.Logout);

router.get('/user',passport.authenticate('jwt'),authControllers.getUser);

router.get('/google',passport.authenticate('google',{ scope: ['email','profile'] }));
router.get('/google/callback',passport.authenticate('google',{
    successRedirect: `success`,
    failureRedirect: `failure`
}));

router.get('/google/success', (req, res) => {
    console.log("Got IN");
    // setJWT
    const payload = {
        id: req.user._id,
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
          }).redirect(process.env.CLIENT_URL);
        }
      );
})
router.get('/google/failure', (req, res) => {
    res.redirect(process.env.CLIENT_URL+"/register");
})

module.exports = router;