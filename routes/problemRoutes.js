const express = require('express');
const router = express.Router();
const isProblemAvailable = require("../middlewares/isProblemAvailable");
const problemController = require("../controllers/problemController");
const upload = require("../middlewares/upload");
const middleware = require("../utils/Middleware");
const Middleware = new middleware;
const { PEP,RBACMiddleware,ABACMiddleware,EthicalWallPolicy,PDP } = require("../utils/PolicyEnforcementPoint");
const isLead = require('../middlewares/isLead');
const isProblemSetter = require('../middlewares/isProblemSetter');
const isCoLead = require('../middlewares/isCoLead');
const rbacMiddleware = new RBACMiddleware();
const ethicalWallPolicy = new EthicalWallPolicy();
const abacMiddleware = new ABACMiddleware();

router.post("/create", upload.fields([
            { name: 'testcase', maxCount: 1 },
            { name: 'answer', maxCount: 1 }
          ]), problemController.createProblem);

router.get("/all",problemController.getProblemList);

router.get("/managable",Middleware.getOR[
                                    isLead,
                                    isProblemSetter,
                                    isCoLead
                                  ],problemController.getManagable);

router.post("/edit/:id",upload.fields([
              { name: 'testcase', maxCount: 1 },
              { name: 'answer', maxCount: 1 }
            ]),
            Middleware.getOR([
              Middleware.getAndPromise[rbacMiddleware("update_problem"),PDP.execute], // For passing lead and colead
              Middleware.getAndPromise[ethicalWallPolicy.execute("update_problem"),PDP.execute] // For Passing the problem author
            ]),problemController.editProblem);

router.post("/delete/:id",
                      Middleware.getOR([
                        Middleware.getAndPromise[rbacMiddleware("delete_problem"),PDP.execute], // For passing lead and colead
                        Middleware.getAndPromise[ethicalWallPolicy.execute("delete_problem"),PDP.execute] // For Passing the problem author
                      ]),problemController.deleteProblem);

router.post("/editorial/:id",
                            Middleware.getAnd(
                              [abacMiddleware("add_editorial","problem"),PDP.execute]
                            ),problemController.addEditorial);
                        
router.get("/editorial/:id",problemController.getEditorial); // Protecting a DB query

router.get("/count",problemController.getProblemCount);

router.get("/:id",
          Middleware.getOR([
          Middleware.getAndPromise([rbacMiddleware.execute("view_problem"),PDP.execute]),
          isProblemAvailable]),
          problemController.getProblem);

module.exports = router;