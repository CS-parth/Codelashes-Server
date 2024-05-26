const mongoose = require('mongoose');
const passport = require('passport');

const UserSchema = mongoose.Schema({
    username: String,
    email: String,
    password: String
});

module.exports = mongoose.model('User',UserSchema);