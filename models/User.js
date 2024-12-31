const mongoose = require('mongoose');


const UserSchema = mongoose.Schema({
    username: String,
    email: String,
    googleID: String,
    password: {
        type: String,
        required: function(){
            return this.googleID ? false : true
        }
    },
    rating: [{type:Number}],
    role: { type: String, required: true },
});

const User = mongoose.model('User',UserSchema);

module.exports = User;