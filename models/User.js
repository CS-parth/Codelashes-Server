const mongoose = require('mongoose');


const UserSchema = mongoose.Schema({
    username: String,
    email: String,
    password: String,
    rating: {type:Number,default:0},
    role: { type: String, required: true}
});

const User = mongoose.model('User',UserSchema);

module.exports = User;