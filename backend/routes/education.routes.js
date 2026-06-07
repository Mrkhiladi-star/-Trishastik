const express = require("express");
const router = express.Router();
const educationController = require("../controllers/education.controller");
const { isLoggedIn } = require("../middleware/auth");

router.get("/education", educationController.getEducation);
router.get("/educationnew", isLoggedIn, educationController.checkEducationPermission);
router.post("/educationnew", isLoggedIn, educationController.createEducation);

module.exports = router;
