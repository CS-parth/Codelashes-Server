const mongoose = require('mongoose');
const User = require('./User');

const participantSchema = mongoose.Schema({

});

const Participant = User.discriminator("Participant",participantSchema);

module.exports = Participant;