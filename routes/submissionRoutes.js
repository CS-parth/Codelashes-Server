const express = require('express');
const router = express.Router();
const submissionController = require("../controllers/submissionController");

router.get("/my/:username/:contest", submissionController.getContestMySubmissions);
router.get("/all/:contest", submissionController.getContestAllSubmissions);

module.exports = router;