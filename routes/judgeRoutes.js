const express = require('express');
const { submitController } = require('../controllers/judgeControllers');
const router = express.Router();

router.post("/submit",submitController);
router.post("/run",);

module.exports = router;