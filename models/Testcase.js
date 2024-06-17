const mongoose = require('mongoose');

const testcaseSchema = new mongoose.Schema({
    time: {
      type: Number,
      required: true,
    },
    memory: {
      type: Number,
      required: true,
    },
    data: {
        type: String, // url of the testcase
        required: true
    },
    verdict: {
      type: String,
      required: true,
    },
});

const Testcase = mongoose.model("Testcase",testcaseSchema);

module.exports = Testcase;