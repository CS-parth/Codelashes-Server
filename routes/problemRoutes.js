const express = require('express');
const router = express.Router();

const problemController = require("../controllers/problemController");
const upload = require("../middlewares/upload");
router.post("/create",upload.fields([{name: "testcase",maxCount:1},{name: "answer",maxCount:1}]),problemController.createProblem);

module.exports = router;