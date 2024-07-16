const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");


class Validation{
    constructor(){}
    
    async getPayload(token){
        const decodedToken = jwt.verify(token,process.env.SECRET_KEY);
        return decodedToken;
    }
    async getUser(token){
        const decodedToken = await this.getPayload(token);
        if(!mongoose.Types.ObjectId.isValid(decodedToken.id)){
            console.error("Invalid User Id");
            return null;
        }
        const user = await User.findById(decodedToken.id);
        return user;
    }
    async getRole(token){
        const decodedToken = await this.getPayload(token);
        if(!mongoose.Types.ObjectId.isValid(decodedToken.id)){
            console.error("Invalid User Id");
            return null;
        }
        const user = await User.findById(decodedToken.id,'role');
        return user.role;
    }
}

module.exports = Validation;