const express = require('express');
const { submitController } = require('../controllers/judgeControllers');
const router = express.Router();

const { isSubmissionsBlocked } = require("../middlewares/isSubmissionsBlocked");
const { isProblemAvailable }  = require("../middlewares/isProblemAvailable");

const middleware = require("../utils/Middleware");
const Middleware = new middleware();

const { PEP,RBACMiddleware,ABACMiddleware,EthicalWallPolicy,PDP } = require("../utils/PolicyEnforcementPoint");
const ethicalWallPolicy = new EthicalWallPolicy();

router.post("/submit",
                Middleware.Middleware.getAnd([
                    ethicalWallPolicy("create_submission"),PDP.execute,
                    isProblemAvailable,
                    isSubmissionsBlocked
                ]),submitController); // This is solution submittion against a problem

module.exports = router;