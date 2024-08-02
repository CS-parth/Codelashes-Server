const express = require('express');
const router = express.Router();
const resultController = require('../controllers/resultController');
const isContestStarted = require('../middlewares/isContestStarted');
const middleware = require("../utils/Middleware");
const Middleware = new middleware();

router.get("/:id",Middleware.single(isContestStarted),resultController.getRanking);

module.exports = router;