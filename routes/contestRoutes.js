const express = require('express');
const router = express.Router();
const contestController = require("../controllers/contestController");
const isContestStarted = require("../middlewares/isContestStarted");
const { PEP,RBACMiddleware,ABACMiddleware,EthicalWallPolicy,PDP } = require("../utils/PolicyEnforcementPoint");
const rbacMiddleware = new RBACMiddleware();
const ethicalWallPolicy = new EthicalWallPolicy();
const isLead = require("../middlewares/isLead");
const isCoLead = require("../middlewares/isCoLead");
const isProblemSetter = require("../middlewares/isProblemSetter");
const middleware = require("../utils/Middleware");
const Middleware = new middleware;
const testing = require("../middlewares/test");

router.post("/create",
            Middleware.getAnd([rbacMiddleware.execute("create_contest"),PDP.execute]),
            contestController.createContest);

router.get("/all",contestController.getContestList);

router.get("/meta/:id",contestController.getContestMeta); // For everyone

router.get("/managable",Middleware.getOR([
                            isLead,
                            isCoLead,
                            isProblemSetter
                        ]),
                        contestController.getManagable); // Query params

router.post("/edit/:id",Middleware.getOR([
                            isLead,
                            isCoLead
                        ]),contestController.editContest);

router.get("/my",contestController.getProfileContest); // for All

router.get("/:id",
            Middleware.getOR([isLead,isProblemSetter,isCoLead,isContestStarted]),
            contestController.getContest);

module.exports = router;