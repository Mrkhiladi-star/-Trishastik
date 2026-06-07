const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profile.controller");
const { isLoggedIn } = require("../middleware/auth");
const { upload } = require("../config/multer");

router.get("/", isLoggedIn, profileController.getProfile);
router.put("/", isLoggedIn, profileController.updateProfile);
router.post("/photo", isLoggedIn, upload.single("photo"), profileController.updatePhoto);
router.post("/change-password", isLoggedIn, profileController.changePassword);

module.exports = router;
