const express = require('express');
const { submitController } = require('../controllers/judgeControllers');
const router = express.Router();
const { isSubmissionsBlocked }= require("../middlewares/isSubmissionsBlocked");
const middleware = require("../utils/Middleware");
const Middleware = new middleware();

router.post("/submit",Middleware.single(isSubmissionsBlocked),submitController);

module.exports = router;