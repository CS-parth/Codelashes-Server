const passport = require('passport');
require('../config/passport');(passport)

function passportAuth(strategy, options) {
    return (req, res,next) => {
        return new Promise((resolve, reject) => {
            passport.authenticate(strategy, options, (err, user, info) => {
                if (err || !user) {
                    return reject({ status: 403, message: err || info?.message || 'Authentication failed' });
                }
                return resolve();
            })(req, res,next);
        })
    };
}

module.exports = passportAuth;
