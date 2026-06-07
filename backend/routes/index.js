const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const adminRoutes = require("./admin.routes");
const profileRoutes = require("./profile.routes");
const listingRoutes = require("./listing.routes");
const blogRoutes = require("./blog.routes");
const educationRoutes = require("./education.routes");
const soilTestRoutes = require("./soilTest.routes");
const orderRoutes = require("./order.routes");

router.use("/", authRoutes);
router.use("/admin", adminRoutes);
router.use("/profile", profileRoutes);
router.use("/", listingRoutes);
router.use("/", blogRoutes);
router.use("/", educationRoutes);
router.use("/", soilTestRoutes);
router.use("/", orderRoutes);

module.exports = router;
