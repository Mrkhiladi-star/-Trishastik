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

router.get("/db-status", (req, res) => {
  const mongoose = require("mongoose");
  const connectionState = mongoose.connection.readyState;
  const states = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };
  res.json({
    status: "ok",
    dbState: states[connectionState] || "unknown",
    dbHost: mongoose.connection.host || "none",
    dbName: mongoose.connection.name || "none",
    usingMemoryServer: (mongoose.connection.host || "").includes("127.0.0.1") || !(mongoose.connection.host || "").includes("mongodb.net"),
    envAtlasDbUrlSet: !!process.env.ATLASDB_URL,
    nodeEnv: process.env.NODE_ENV || "development"
  });
});

module.exports = router;
