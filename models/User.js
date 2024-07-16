const mongoose = require('mongoose');


const UserSchema = mongoose.Schema({
    username: String,
    email: String,
    password: String,
    rating: Number,
    role: { type: String, required: true }
});

const User = mongoose.model('User',UserSchema);

module.exports = User;