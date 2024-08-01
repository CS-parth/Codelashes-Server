const express = require('express');
const router = express.Router();
const blogController = require("../controllers/blogController.js");
const middleware = require("../utils/Middleware.js");
const Middleware = new middleware();
const { PEP,RBACMiddleware,ABACMiddleware,ChineseWallPolicy,PDP } = require("../utils/PolicyEnforcementPoint");
const rbacMiddleware = new RBACMiddleware();
const isLead = require("../middlewares/isLead");
const isCoLead = require("../middlewares/isCoLead");
const isProblemSetter = require("../middlewares/isProblemSetter");

router.post("/create",Middleware.single(rbacMiddleware.execute("create_blog")),blogController.createBlog);

router.get("/managable",
            Middleware.getOR([
                isLead,
                isCoLead,
                isProblemSetter
            ]),blogController.getManagableBlog);

router.get("/all",blogController.getAllBlog);

module.exports = router;