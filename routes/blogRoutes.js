const express = require('express');
const router = express.Router();
const blogController = require("../controllers/blogController.js");

router.post("/create",blogController.createBlog);
router.get("/managable",blogController.getManagableBlog);
router.get("/all",blogController.getAllBlog);
module.exports = router;