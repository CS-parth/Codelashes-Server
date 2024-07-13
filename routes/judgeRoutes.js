const express = require('express');
const { submitController } = require('../controllers/judgeControllers');
const router = express.Router();
const { isSubmissionsBlocked }= require("../middlewares/isSubmissionsBlocked");
router.post("/submit",isSubmissionsBlocked,submitController);
// router.post("/run",);

module.exports = router;