const mongoose = require('mongoose');
const User = require('./User');

const leadSchema = mongoose.Schema({

});

const Lead = User.discriminator("Lead",leadSchema);

module.exports = Lead;