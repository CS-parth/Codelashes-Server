const express = require('express');
const router = express.Router();
const contestController = require("../controllers/contestController");

router.post("/create",contestController.createContest);
router.get("/all",contestController.getContestList);
router.get("/:id",contestController.getContest);

module.exports = router;