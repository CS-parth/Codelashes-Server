const mongoose = require("mongoose");
const { testcaseSchema } = require("./Testcase");
const SubmissionSchema = new mongoose.Schema({
  problem: {
    type: mongoose.Types.ObjectId,
    ref: "Problem",
    required: true,
  },
  code: {
    type: String, // saving the url of the code
  },
  language: {
    type: String,
    required: true,
  },
  // user: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "User",
  //   required: true,
  // },
  date: {
    type: Date,
    default: Date.now,
  },
  verdict: {
    type: String, // final verdict of after running all the testcases
  },
  result: {
    type: [testcaseSchema], // result of the complete testcases
    required: true,
  },
  jobId: String,
  username: {
    type: String,
    required: true
  },
  contest: {
     type: mongoose.Types.ObjectId,
     ref:"Contest",
     required: true
  },
  isRated: Boolean
},{timestamps: true});

const Submission = mongoose.model("Submission", SubmissionSchema);

module.exports = Submission;
