const mongoose = require('mongoose');

const testcaseSchema = new mongoose.Schema({
    time: {
      type: Number
    },
    memory: {
      type: Number
    },
    data: {
        url: {
          type: String,
          required: true
        },
        access_token: {
          type: String,
          required: true
        }
    },
    answer: {
        url: {
          type: String,
          required: true
        },
        access_token: {
          type: String,
          required: true
        }
    },
    verdict: {
      type: String
    },
    problem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem'
    }
});

const Testcase = mongoose.model("Testcase",testcaseSchema);

module.exports = { Testcase, testcaseSchema } ;