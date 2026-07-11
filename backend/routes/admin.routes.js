const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const adminSettingsController = require("../controllers/admin.settings.controller");
const { isLoggedIn, authorizeRoles } = require("../middleware/auth");

router.get("/users", isLoggedIn, authorizeRoles("admin"), authController.adminGetAllUsers);
router.put("/users/:id/role", isLoggedIn, authorizeRoles("admin"), authController.adminUpdateUserRole);

// Weight Rules
router.get("/weight-rules", isLoggedIn, authorizeRoles("admin"), adminSettingsController.getWeightRules);
router.post("/weight-rules", isLoggedIn, authorizeRoles("admin"), adminSettingsController.createWeightRule);
router.put("/weight-rules/:id", isLoggedIn, authorizeRoles("admin"), adminSettingsController.updateWeightRule);
router.delete("/weight-rules/:id", isLoggedIn, authorizeRoles("admin"), adminSettingsController.deleteWeightRule);

// Category Markups
router.get("/markups", isLoggedIn, authorizeRoles("admin"), adminSettingsController.getMarkups);
router.put("/markups/:id", isLoggedIn, authorizeRoles("admin"), adminSettingsController.updateMarkup);

// Financial Report
router.get("/finance-report", isLoggedIn, authorizeRoles("admin"), adminSettingsController.getFinanceReport);

module.exports = router;
