const mongoose = require("mongoose");

const SubmissionSchema = new mongoose.Schema({
  problem: {
    type: mongoose.Types.ObjectId,
    required: true,
  },
  code: {
    type: String, // saving the url of the code
  },
  language: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  verdict: {
    type: String, // final verdict of after running all the testcases
  },
  result: {
    type: [testcases], // result of the complete testcases
    required: true,
  },
},{timestamps: true});

const Submission = mongoose.model("Submission", SubmissionSchema);

module.exports = Submission;
