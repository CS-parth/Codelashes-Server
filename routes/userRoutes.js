const express = require('express');
const router = express.Router();

const userController = require("../controllers/userController");

router.get("/setters",userController.getSetters);
router.get("/rating",userController.getRating);

module.exports = router;