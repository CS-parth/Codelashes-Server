const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
router.get("/:id",resultController.getRanking);

module.exports = router;