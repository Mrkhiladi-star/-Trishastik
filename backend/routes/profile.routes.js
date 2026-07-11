const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profile.controller");
const { isLoggedIn } = require("../middleware/auth");
const { upload } = require("../config/multer");

router.get("/", isLoggedIn, profileController.getProfile);
router.put("/", isLoggedIn, profileController.updateProfile);
router.post("/photo", isLoggedIn, upload.single("photo"), profileController.updatePhoto);
router.post("/change-password", isLoggedIn, profileController.changePassword);
router.get("/vehicle", isLoggedIn, profileController.getVehicle);
router.post("/vehicle", isLoggedIn, profileController.addVehicle);
router.put("/vehicle/:id", isLoggedIn, profileController.updateVehicle);
router.post("/vehicle/:id", isLoggedIn, profileController.updateVehicle);
router.delete("/vehicle/:id", isLoggedIn, profileController.deleteVehicle);

module.exports = router;
