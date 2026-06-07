const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { isLoggedIn, authorizeRoles } = require("../middleware/auth");

router.get("/users", isLoggedIn, authorizeRoles("admin"), authController.adminGetAllUsers);
router.put("/users/:id/role", isLoggedIn, authorizeRoles("admin"), authController.adminUpdateUserRole);

module.exports = router;
