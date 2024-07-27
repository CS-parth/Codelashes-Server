const express = require('express');
const router = express.Router();
const blogController = require("../controllers/blogController.js");

router.post("/create",blogController.createBlog);

module.exports = router;