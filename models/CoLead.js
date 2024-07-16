const mongoose = require('mongoose');
const User = require('./User');

const coLeadSchema = mongoose.Schema({

});

const CoLead = User.discriminator("CoLead",coLeadSchema);

module.exports = CoLead;