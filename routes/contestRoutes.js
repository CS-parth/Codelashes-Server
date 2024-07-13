const express = require('express');
const router = express.Router();
const contestController = require("../controllers/contestController");
const isContestStarted = require("../middlewares/isContestStarted");

router.post("/create",contestController.createContest);
router.get("/all",contestController.getContestList);
router.get("/meta/:id",contestController.getContestMeta);
router.get("/:id",isContestStarted,contestController.getContest);

module.exports = router;