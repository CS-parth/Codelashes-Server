const express = require('express');
const router = express.Router();
const isProblemAvailable = require("../middlewares/isProblemAvailable");
const problemController = require("../controllers/problemController");
const upload = require("../middlewares/upload");
const middleware = require("../utils/Middleware");
const Middleware = new middleware;
const { PEP,RBACMiddleware,ABACMiddleware,ethicalWallPolicy,PDP } = require("../utils/PolicyEnforcementPoint");
const rbacMiddleware = new RBACMiddleware();

router.post("/create", upload.fields([
            { name: 'testcase', maxCount: 1 },
            { name: 'answer', maxCount: 1 }
          ]), problemController.createProblem);

router.get("/all",problemController.getProblemList);

router.get("/managable",problemController.getManagable)

router.post("/edit/:id",upload.fields([
              { name: 'testcase', maxCount: 1 },
              { name: 'answer', maxCount: 1 }
            ]),problemController.editProblem);

router.post("/delete/:id",problemController.deleteProblem);

router.post("/editorial/:id",problemController.addEditorial);
router.get("/editorial/:id",problemController.getEditorial);

router.get("/count",problemController.getProblemCount);

router.get("/:id",
          Middleware.getOR([
          Middleware.getAndPromise([rbacMiddleware.execute("view_problem"),PDP.execute]),
          isProblemAvailable]),
          problemController.getProblem);

module.exports = router;