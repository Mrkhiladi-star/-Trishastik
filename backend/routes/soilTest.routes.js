const express = require("express");
const router = express.Router();
const soilTestController = require("../controllers/soilTest.controller");
const { isLoggedIn, authorizeRoles } = require("../middleware/auth");
const { upload } = require("../config/multer");

// Farmer / Agent routes
router.get("/soil-tests", isLoggedIn, soilTestController.getSoilTests);
router.post("/soil-tests", isLoggedIn, soilTestController.createSoilTest);

// Admin specific routes
router.get("/admin/soil-tests", isLoggedIn, authorizeRoles("admin"), soilTestController.adminGetAllSoilTests);
router.get("/admin/agents", isLoggedIn, authorizeRoles("admin"), soilTestController.adminGetAllAgents);
router.post("/admin/soil-tests/:id/assign", isLoggedIn, authorizeRoles("admin"), soilTestController.adminAssignAgent);
router.post("/admin/soil-tests/:id/publish", isLoggedIn, authorizeRoles("admin"), soilTestController.adminPublishReport);

// Admin/Agent routes
router.post("/admin/soil-tests/:id/report-upload", isLoggedIn, authorizeRoles("admin", "agent", "fieldAgent"), upload.single("report"), soilTestController.uploadReport);
router.post("/admin/soil-tests/:id/report", isLoggedIn, authorizeRoles("admin", "agent", "fieldAgent"), soilTestController.updateReport);

// Agent specific routes
router.get("/agent/soil-tests", isLoggedIn, authorizeRoles("agent", "fieldAgent"), soilTestController.agentGetAssignedSoilTests);
router.post("/agent/soil-tests/:id/status", isLoggedIn, authorizeRoles("agent", "admin", "fieldAgent"), soilTestController.agentUpdateStatus);

// Grok AI analysis
router.post("/soil-tests/:id/analyze", isLoggedIn, authorizeRoles("admin"), soilTestController.analyzeReport);

module.exports = router;
