if (process.env.NODE_ENV != "production") {
  require("dotenv").config();
}
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const cors = require("cors");

const Listing = require("./models/listing.js");
const Blog = require("./models/blog.js");
const Education = require("./models/education.js");
const User = require("./models/user.js");
const Customer = require("./models/customer.js");
const Review = require("./models/review.js");
const SoilTest = require("./models/soilTest.js");
const Order = require("./models/order.js");

const dbUrl = process.env.ATLASDB_URL;
const { isLoggedIn } = require("./middleware.js");

// Connect to MongoDB with robust in-memory fallback
async function main() {
  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(dbUrl, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to MongoDB Atlas successfully");
  } catch (err) {
    console.error("DB connection error, attempting fallback to memory server:", err.message);
    try {
      await mongoose.disconnect(); // Tdown previous failed connection states
      console.log("Loading mongodb-memory-server...");
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      console.log(`Starting in-memory MongoDB at ${mongoUri}`);
      await mongoose.connect(mongoUri);
      console.log("Connected to in-memory MongoDB!");
    } catch (fallbackErr) {
      console.error("Failed to start in-memory MongoDB, attempting local MongoDB:", fallbackErr.message);
      try {
        await mongoose.disconnect();
        const localUri = "mongodb://127.0.0.1:27017/trishastik";
        await mongoose.connect(localUri);
        console.log("Connected to local MongoDB");
      } catch (localErr) {
        console.error("All DB connection attempts failed:", localErr.message);
      }
    }
  }
}
main();

// CORS configuration for React Frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

const clientPromise = new Promise((resolve) => {
  if (mongoose.connection.readyState === 1) {
    resolve(mongoose.connection.getClient());
  } else {
    mongoose.connection.once("connected", () => {
      resolve(mongoose.connection.getClient());
    });
  }
});

// Session Store
const store = MongoStore.create({
  clientPromise,
  crypto: {
    secret: process.env.SECRET || "mysupersecretcode",
  },
  touchAfter: 24 * 3600,
});

store.on("error", (err) => {
  console.log("ERROR in MONGO SESSION STORE", err);
});

const sessionOptions = {
  store,
  secret: process.env.SECRET || "mysupersecretcode",
  resave: false,
  saveUninitialized: false,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  },
};

// Middleware
app.use(session(sessionOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.currUser = req.user;
  next();
});

// --- API GET ROUTES ---

// Get listings and reviews (Home Page data)
app.get("/", async (req, res) => {
  try {
    const allListings = await Listing.find({}).populate("owner", "username email");
    const allReviews = await Review.find({});
    res.json({ allReviews, allListings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get blogs
app.get("/blog", async (req, res) => {
  try {
    const allListings = await Blog.find({});
    res.json({ allListings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get profile
app.get("/profile", isLoggedIn, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).populate("cart").populate("order");
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get education listings
app.get("/education", async (req, res) => {
  try {
    const allListings = await Education.find({});
    res.json({ allListings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Permission checks for page actions (returning authorization status)
app.get("/new", isLoggedIn, async (req, res) => {
  const allowedEmail = "freeforfire15@gmail.com";
  const isAuthorized = req.user && (req.user.email === allowedEmail || req.user.role === "farmer" || req.user.role === "admin");
  if (isAuthorized) {
    res.json({ authorized: true });
  } else {
    res.status(403).json({ error: "Access denied: Only farmers and admins can list products." });
  }
});

app.get("/newReview", isLoggedIn, async (req, res) => {
  const allowedEmail = "freeforfire15@gmail.com";
  if (req.user && req.user.email !== allowedEmail) {
    res.json({ authorized: true });
  } else {
    res.status(403).json({ error: "Access denied: You are not authorized to view this page." });
  }
});

app.get("/blognew", isLoggedIn, async (req, res) => {
  const allowedEmail = "freeforfire15@gmail.com";
  if (req.user && (req.user.email === allowedEmail || req.user.role === "admin")) {
    res.json({ authorized: true });
  } else {
    res.status(403).json({ error: "Access denied: Only admins can write blogs." });
  }
});

app.get("/educationnew", isLoggedIn, async (req, res) => {
  const allowedEmail = "freeforfire15@gmail.com";
  if (req.user && (req.user.email === allowedEmail || req.user.role === "admin")) {
    res.json({ authorized: true });
  } else {
    res.status(403).json({ error: "Access denied: Only admins can add educational resources." });
  }
});

// Cart and Order actions
app.get("/addtocart/:productid", isLoggedIn, async (req, res) => {
  const allowedEmail = "freeforfire15@gmail.com";
  // Admin and farmers cannot buy products (standard e-commerce practice)
  if (req.user && req.user.role !== "farmer" && req.user.email !== allowedEmail) {
    try {
      let user = await User.findOne({ email: req.user.email });
      user.cart.push(req.params.productid);
      await user.save();
      res.json({ success: true, message: "Added to cart", cart: user.cart });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(403).json({ error: "Access denied: Sellers and administrators cannot buy products." });
  }
});

app.get("/remove-from-cart/:productid", isLoggedIn, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    user.cart = user.cart.filter(productId => productId.toString() !== req.params.productid);
    await user.save();
    res.json({ success: true, message: "Removed from cart", cart: user.cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/shop", isLoggedIn, async (req, res) => {
  const allowedEmail = "freeforfire15@gmail.com";
  if (req.user && req.user.role !== "farmer" && req.user.email !== allowedEmail) {
    try {
      let user = await User.findOne({ email: req.user.email }).populate("cart");
      let users = await User.findOne({ email: req.user.email }).populate("order");
      const totalAmount = user.cart.reduce((sum, item) => sum + item.price, 0);
      const allListings = await Listing.find({}).populate("owner", "username email");
      const cartTitles = user.cart.map(item => item.title).join(", ");
      res.json({ user, users, totalAmount, cartTitles, allListings });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(403).json({ error: "Access denied: Shop views are restricted to customers." });
  }
});

app.get("/checkout", isLoggedIn, async (req, res) => {
  try {
    let user = await User.findOne({ email: req.user.email }).populate("cart");
    const cartTitles = user.cart.map(item => item.title).join(", ");
    const totalAmount = user.cart.reduce((sum, item) => sum + item.price, 0);
    res.json({ user, cartTitles, totalAmount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/customer", isLoggedIn, async (req, res) => {
  const allowedEmail = "freeforfire15@gmail.com";
  if (req.user && (req.user.email === allowedEmail || req.user.role === "admin" || req.user.role === "farmer")) {
    try {
      const allListings = await Customer.find({});
      res.json({ allListings });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(403).json({ error: "Access denied: You are not authorized to view customer checkouts." });
  }
});

// --- SELLER DASHBOARD ENDPOINTS ---

app.get("/seller/listings", isLoggedIn, async (req, res) => {
  const allowedEmail = "freeforfire15@gmail.com";
  const isSeller = req.user && (
    req.user.role === "farmer" || 
    req.user.role === "fertilizer_seller" || 
    req.user.role === "instrument_seller" || 
    req.user.role === "admin" || 
    req.user.email === allowedEmail
  );
  if (isSeller) {
    try {
      const myListings = await Listing.find({ owner: req.user._id });
      res.json({ myListings });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(403).json({ error: "Access denied: Only sellers can fetch inventory logs." });
  }
});

// --- UPLOAD CONFIGURATION ---
const multer = require("multer");
const fs = require("fs");
const uploadDir = path.join(__dirname, "public/uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Serve static files from public/uploads
app.use("/uploads", express.static(uploadDir));

// --- USER PROFILE ENDPOINTS ---

// Update profile details
app.put("/profile", isLoggedIn, async (req, res) => {
  try {
    const { fullName, phone, address, farmingInfo, landDetails } = req.body;
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    
    if (fullName !== undefined) user.fullName = fullName;
    if (phone !== undefined) user.phone = phone;
    if (address) {
      user.address = { ...user.address, ...address };
    }
    if (farmingInfo) {
      user.farmingInfo = { ...user.farmingInfo, ...farmingInfo };
    }
    if (landDetails) {
      user.landDetails = { ...user.landDetails, ...landDetails };
    }

    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update profile photo (base64 or file upload)
app.post("/profile/photo", isLoggedIn, upload.single("photo"), async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    if (req.file) {
      user.profilePhoto = `/uploads/${req.file.filename}`;
    } else if (req.body.photo) {
      // Base64 upload
      user.profilePhoto = req.body.photo;
    }
    await user.save();
    res.json({ success: true, profilePhoto: user.profilePhoto });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change password endpoint
app.post("/profile/change-password", isLoggedIn, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Old and new passwords are required." });
    }
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    await user.changePassword(oldPassword, newPassword);
    res.json({ success: true, message: "Password updated successfully!" });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to change password." });
  }
});

// --- SOIL TESTING SYSTEM ENDPOINTS ---

// Get my soil testing history
app.get("/soil-tests", isLoggedIn, async (req, res) => {
  try {
    let tests;
    if (req.user.role === "agent") {
      tests = await SoilTest.find({ agent: req.user._id }).populate("farmer", "username email fullName").sort({ requestedAt: -1 });
    } else {
      tests = await SoilTest.find({ farmer: req.user._id }).populate("agent", "username email fullName").sort({ requestedAt: -1 });
    }
    res.json({ soilTests: tests });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new soil testing request
app.post("/soil-tests", isLoggedIn, async (req, res) => {
  try {
    const { farmerName, phone, farmArea, cropPlanned, soilType, address, stateDistrictVillage, additionalNotes, latitude, longitude } = req.body.soilTest;
    if (!farmerName || !phone || !farmArea || !cropPlanned || !soilType || !address || !stateDistrictVillage || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "Please enter all required soil test details including location." });
    }
    const newTest = new SoilTest({
      farmer: req.user._id,
      farmerName,
      phone,
      farmArea,
      cropPlanned,
      soilType,
      address,
      stateDistrictVillage,
      additionalNotes,
      latitude,
      longitude,
      status: "Pending"
    });
    await newTest.save();
    res.json({ success: true, soilTest: newTest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ADMIN CONTROL ENDPOINTS ---

// Admin views all soil tests
app.get("/admin/soil-tests", isLoggedIn, async (req, res) => {
  const allowedEmail = "freeforfire15@gmail.com";
  const isAdmin = req.user && (req.user.role === "admin" || req.user.email === allowedEmail);
  if (isAdmin) {
    try {
      const allTests = await SoilTest.find({})
        .populate("farmer", "username email fullName role")
        .populate("agent", "username email fullName phone")
        .sort({ requestedAt: -1 });
      res.json({ soilTests: allTests });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(403).json({ error: "Access denied: Admin only." });
  }
});

// Admin fetches all field agents
app.get("/admin/agents", isLoggedIn, async (req, res) => {
  const allowedEmail = "freeforfire15@gmail.com";
  const isAdmin = req.user && (req.user.role === "admin" || req.user.email === allowedEmail);
  if (isAdmin) {
    try {
      const agents = await User.find({ role: "agent" }, "username email fullName phone");
      res.json({ agents });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(403).json({ error: "Access denied: Admin only." });
  }
});

// Admin assigns agent
app.post("/admin/soil-tests/:id/assign", isLoggedIn, async (req, res) => {
  const allowedEmail = "freeforfire15@gmail.com";
  const isAdmin = req.user && (req.user.role === "admin" || req.user.email === allowedEmail);
  if (isAdmin) {
    try {
      const { agentId, labFacility } = req.body;
      const test = await SoilTest.findById(req.params.id);
      if (!test) {
        return res.status(404).json({ error: "Soil test not found." });
      }
      
      test.agent = agentId;
      if (labFacility) {
        test.labFacility = labFacility;
      }
      test.status = "Assigned";
      await test.save();
      
      const updatedTest = await SoilTest.findById(req.params.id)
        .populate("farmer", "username email fullName")
        .populate("agent", "username email fullName phone");
        
      res.json({ success: true, soilTest: updatedTest });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(403).json({ error: "Access denied: Admin only." });
  }
});

// Admin/Agent uploads lab report for a test
app.post("/admin/soil-tests/:id/report-upload", isLoggedIn, upload.single("report"), async (req, res) => {
  const allowedEmail = "freeforfire15@gmail.com";
  const isAuthorized = req.user && (req.user.role === "admin" || req.user.role === "agent" || req.user.email === allowedEmail);
  if (isAuthorized) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Please upload a file." });
      }
      const test = await SoilTest.findById(req.params.id);
      if (!test) {
        return res.status(404).json({ error: "Soil test not found." });
      }
      test.labReportUrl = `/uploads/${req.file.filename}`;
      if (test.status !== "Completed" && test.status !== "Report Ready") {
        test.status = "Report Ready";
      }
      if (req.user.role === "agent") {
        test.isPublished = false;
      }
      await test.save();
      res.json({ success: true, labReportUrl: test.labReportUrl, status: test.status });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(403).json({ error: "Access denied: Unauthorized." });
  }
});

// Admin/Agent updates report details
app.post("/admin/soil-tests/:id/report", isLoggedIn, async (req, res) => {
  const allowedEmail = "freeforfire15@gmail.com";
  const isAuthorized = req.user && (req.user.role === "admin" || req.user.role === "agent" || req.user.email === allowedEmail);
  if (isAuthorized) {
    try {
      const { status, reportContent, recommendedFertilizers, isPublished } = req.body;
      const test = await SoilTest.findById(req.params.id);
      if (!test) {
        return res.status(404).json({ error: "Soil test request not found." });
      }
      if (status) {
        if (req.user.role === "agent" && status === "Completed") {
          return res.status(400).json({ error: "Access denied: Agents are not authorized to mark soil tests as Completed." });
        }
        test.status = status;
      }
      if (reportContent !== undefined) test.reportContent = reportContent;
      if (recommendedFertilizers !== undefined) test.recommendedFertilizers = recommendedFertilizers;
      
      if (req.user.role === "agent") {
        test.isPublished = false;
      } else if (req.user.role === "admin" || req.user.email === allowedEmail) {
        if (isPublished !== undefined) {
          test.isPublished = isPublished;
        }
      }
      
      await test.save();
      res.json({ success: true, soilTest: test });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(403).json({ error: "Access denied." });
  }
});

// Admin approves & publishes report
app.post("/admin/soil-tests/:id/publish", isLoggedIn, async (req, res) => {
  const allowedEmail = "freeforfire15@gmail.com";
  const isAdmin = req.user && (req.user.role === "admin" || req.user.email === allowedEmail);
  if (isAdmin) {
    try {
      const test = await SoilTest.findById(req.params.id);
      if (!test) {
        return res.status(404).json({ error: "Soil test not found." });
      }
      test.isPublished = true;
      test.status = "Completed";
      await test.save();
      res.json({ success: true, soilTest: test });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(403).json({ error: "Access denied: Admin only." });
  }
});

// Admin fetches all users (farmers / customers / agents)
app.get("/admin/users", isLoggedIn, async (req, res) => {
  const allowedEmail = "freeforfire15@gmail.com";
  const isAdmin = req.user && (req.user.role === "admin" || req.user.email === allowedEmail);
  if (isAdmin) {
    try {
      const users = await User.find({}, "username email fullName role phone farmingInfo landDetails");
      res.json({ users });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(403).json({ error: "Access denied: Admin only." });
  }
});

// Admin updates user role or settings
app.put("/admin/users/:id/role", isLoggedIn, async (req, res) => {
  const allowedEmail = "freeforfire15@gmail.com";
  const isAdmin = req.user && (req.user.role === "admin" || req.user.email === allowedEmail);
  if (isAdmin) {
    try {
      const { role } = req.body;
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }
      user.role = role;
      await user.save();
      res.json({ success: true, user });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(403).json({ error: "Access denied: Admin only." });
  }
});

// --- FIELD AGENT SPECIFIC ENDPOINTS ---

// Agent lists their assigned tests
app.get("/agent/soil-tests", isLoggedIn, async (req, res) => {
  if (req.user.role === "agent") {
    try {
      const tests = await SoilTest.find({ agent: req.user._id })
        .populate("farmer", "username email fullName phone address")
        .sort({ requestedAt: -1 });
      res.json({ soilTests: tests });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(403).json({ error: "Access denied: Agent only." });
  }
});

// Agent updates soil test status
app.post("/agent/soil-tests/:id/status", isLoggedIn, async (req, res) => {
  if (req.user.role === "agent" || req.user.role === "admin") {
    try {
      const { status } = req.body;
      const allowedStatuses = ["Assigned", "Sample Collected", "Testing", "Report Ready"];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status update for field agent." });
      }
      const test = await SoilTest.findById(req.params.id);
      if (!test) {
        return res.status(404).json({ error: "Soil test not found." });
      }
      if (test.agent && test.agent.toString() !== req.user._id.toString() && req.user.role !== "admin") {
        return res.status(403).json({ error: "Access denied: You are not the assigned agent." });
      }
      test.status = status;
      await test.save();
      res.json({ success: true, soilTest: test });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(403).json({ error: "Access denied: Agent or Admin only." });
  }
});

// --- GROK AI SOIL REPORT ANALYSIS ENDPOINT ---

app.post("/soil-tests/:id/analyze", isLoggedIn, async (req, res) => {
  const allowedEmail = "freeforfire15@gmail.com";
  const isAuthorized = req.user && (req.user.role === "admin" || req.user.email === allowedEmail);
  if (!isAuthorized) {
    return res.status(403).json({ error: "Access denied: Only admins can generate AI suggestions." });
  }
  try {
    const test = await SoilTest.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ error: "Soil test request not found." });
    }

    if (req.body.reportContent !== undefined) {
      test.reportContent = req.body.reportContent;
    }
    if (req.body.recommendedFertilizers !== undefined) {
      test.recommendedFertilizers = req.body.recommendedFertilizers;
    }
    if (req.body.reportContent !== undefined || req.body.recommendedFertilizers !== undefined) {
      await test.save();
    }

    const { reportContent, cropPlanned, soilType, farmArea } = test;
    if (!reportContent) {
      return res.status(400).json({ error: "Cannot generate AI suggestions without soil report analysis details. Please fill out the Soil Analysis Summary first." });
    }

    const grokKey = process.env.GROK_API_KEY;
    let aiResponseData;

    if (!grokKey) {
      console.log("GROK_API_KEY env not configured, generating mock response...");
      const pHMatch = reportContent.match(/pH\s*[:=]\s*([0-9.]+)/i);
      const pHVal = pHMatch ? parseFloat(pHMatch[1]) : 6.5;
      const isAcidic = pHVal < 6.0;
      const isAlkaline = pHVal > 7.5;
      
      const nMatch = reportContent.toLowerCase().includes("nitrogen") || reportContent.toLowerCase().includes("low n") || reportContent.toLowerCase().includes("deficien");
      const pMatch = reportContent.toLowerCase().includes("phosphorus") || reportContent.toLowerCase().includes("low p");
      const kMatch = reportContent.toLowerCase().includes("potassium") || reportContent.toLowerCase().includes("low k");

      let npkStr = "Nitrogen: Optimal. Phosphorus: Moderate. Potassium: High.";
      let deficiencyStr = "No significant deficiencies found. Soil is well balanced.";
      let fertStr = `Apply general organic compost. Standard dosage: 2-3 tons per acre for a farm area of ${farmArea} acres.`;
      
      if (nMatch || isAcidic) {
        npkStr = "Nitrogen (N): Low. Phosphorus (P): Medium. Potassium (K): High.";
        deficiencyStr = "Nitrogen deficiency detected, which can stunt vegetative growth and cause yellowing leaves.";
        fertStr = "Apply Urea or ammonium sulphate. For organic options, use neem cake or blood meal.";
      } else if (pMatch) {
        npkStr = "Nitrogen (N): Medium. Phosphorus (P): Low. Potassium (K): Medium.";
        deficiencyStr = "Phosphorus deficiency. Root development and seed setting might be hampered.";
        fertStr = "Apply Single Super Phosphate (SSP) or Diammonium Phosphate (DAP). Organic option: Bone meal.";
      }

      aiResponseData = {
        npkAnalysis: npkStr + ` (pH: ${pHVal})`,
        deficiencyExplanation: deficiencyStr,
        fertilizerRecommendation: fertStr + ` Customized for ${farmArea} acres of ${cropPlanned}.`,
        organicImprovement: `Incorporate vermicompost, cow dung manure, and green manuring (dhaincha) to improve soil organic carbon from the current status.`,
        waterManagement: `For ${soilType} soil, implement drip irrigation to prevent leaching. Maintain moist conditions but avoid waterlogging for ${cropPlanned}.`,
        bestCrops: `${cropPlanned} is suitable. Rotate with leguminous crops like chickpeas, field peas, or green gram to restore nitrogen naturally.`
      };
    } else {
      console.log("Calling Grok API...");
      
      const prompt = `You are a professional agricultural scientist and soil expert. 
Analyze the following soil testing report details:
Planned Crop: ${cropPlanned}
Farm Area: ${farmArea} acres
Soil Type: ${soilType}
Report Content: ${reportContent}

Provide a detailed, structured, farmer-friendly analysis in JSON format containing the following fields:
{
  "npkAnalysis": "Detailed assessment of Nitrogen (N), Phosphorus (P), and Potassium (K) levels based on the report.",
  "deficiencyExplanation": "Simple explanation of any nutrient deficiencies and their impact on the planned crop.",
  "fertilizerRecommendation": "Specific fertilizer recommendation (amounts, types, application schedule) tailored to the farm area and planned crop.",
  "organicImprovement": "Organic methods and soil improvement tips (e.g., composting, cover crops, biofertilizers).",
  "waterManagement": "Water management and irrigation advice for the soil type and crop.",
  "bestCrops": "Suggestions for the best crops to grow (both planned crop and alternative crop rotations)."
}
Ensure the JSON is valid and only return the JSON block, nothing else. Do not wrap in markdown code blocks.`;

      const apiResponse = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${grokKey}`
        },
        body: JSON.stringify({
          model: "grok-beta",
          messages: [
            { role: "system", content: "You are a soil health analysis AI. Always reply with valid JSON format." },
            { role: "user", content: prompt }
          ],
          temperature: 0.1
        })
      });

      if (!apiResponse.ok) {
        throw new Error(`Grok API error: ${apiResponse.statusText}`);
      }

      const responseJson = await apiResponse.json();
      let text = responseJson.choices[0].message.content.trim();
      
      if (text.startsWith("```")) {
        text = text.replace(/^```json\s*/, "").replace(/```$/, "").trim();
      }

      try {
        aiResponseData = JSON.parse(text);
      } catch (parseErr) {
        console.error("Failed to parse Grok JSON, using text extraction", text);
        aiResponseData = {
          npkAnalysis: "Analysis complete. Consult advisor.",
          deficiencyExplanation: text,
          fertilizerRecommendation: "Refer to description details.",
          organicImprovement: "Apply organic matter regularly.",
          waterManagement: "Water regularly based on crop requirements.",
          bestCrops: cropPlanned
        };
      }
    }

    test.aiAnalysis = aiResponseData;
    await test.save();

    res.json({ success: true, soilTest: test });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API POST ROUTES ---

app.post("/logout", isLoggedIn, async (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.json({ success: true, message: "You are now logged out!" });
  });
});

app.post("/newReview", isLoggedIn, async (req, res) => {
  const allowedEmail = "freeforfire15@gmail.com";
  if (req.user && req.user.email !== allowedEmail) {
    try {
      const newreview = new Review(req.body.histing);
      await newreview.save();
      res.json({ success: true, review: newreview });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(403).json({ error: "Access denied: You are not authorized to perform this action." });
  }
});

app.post("/new", isLoggedIn, async (req, res) => {
  const allowedEmail = "freeforfire15@gmail.com";
  const isAuthorized = req.user && (
    req.user.email === allowedEmail || 
    req.user.role === "farmer" || 
    req.user.role === "admin" ||
    req.user.role === "fertilizer_seller" ||
    req.user.role === "instrument_seller"
  );
  if (isAuthorized) {
    try {
      const { title, description, price, image, category, location, latitude, longitude } = req.body.listing;
      const newlistings = new Listing({
        title,
        description,
        price,
        image,
        category: category || "organic_product",
        location: location || "",
        latitude: latitude !== undefined ? Number(latitude) : 27.56,
        longitude: longitude !== undefined ? Number(longitude) : 80.68,
        owner: req.user._id
      });
      await newlistings.save();
      res.json({ success: true, listing: newlistings });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(403).json({ error: "Access denied: You are not authorized to perform this action." });
  }
});

app.post("/blognew", isLoggedIn, async (req, res) => {
  const allowedEmail = "freeforfire15@gmail.com";
  if (req.user && (req.user.email === allowedEmail || req.user.role === "admin")) {
    try {
      const newblog = new Blog(req.body.pisting);
      await newblog.save();
      res.json({ success: true, blog: newblog });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(403).json({ error: "Access denied: You are not authorized to perform this action." });
  }
});

app.post("/educationnew", isLoggedIn, async (req, res) => {
  const allowedEmail = "freeforfire15@gmail.com";
  if (req.user && (req.user.email === allowedEmail || req.user.role === "admin")) {
    try {
      const neweducation = new Education(req.body.histing);
      await neweducation.save();
      res.json({ success: true, education: neweducation });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(403).json({ error: "Access denied: You are not authorized to perform this action." });
  }
});

app.post("/register", async (req, res, next) => {
  try {
    let { username, email, password, role } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Please fill in all details." });
    }
    const newUser = new User({ 
      email, 
      username,
      role: role || "customer"
    });
    const registeredUser = await User.register(newUser, password);
    req.login(registeredUser, (err) => {
      if (err) {
        return next(err);
      }
      res.json({ 
        success: true, 
        user: { 
          username: registeredUser.username, 
          email: registeredUser.email, 
          role: registeredUser.role,
          cart: registeredUser.cart, 
          order: registeredUser.order 
        } 
      });
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// JSON Login Router utilizing passport's local authentication callback
app.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ error: info ? info.message : "Authentication failed" });
    }
    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.json({
        success: true,
        user: { 
          username: user.username, 
          email: user.email, 
          role: user.role,
          cart: user.cart, 
          order: user.order 
        }
      });
    });
  })(req, res, next);
});

app.post("/checkout", isLoggedIn, async (req, res) => {
  try {
    const newlistings = new Customer(req.body.listing);
    await newlistings.save();
    const user = await User.findOne({ email: req.user.email }).populate("cart");
    const productIds = req.body.productIds;
    if (!productIds || productIds.length === 0) {
      return res.status(400).json({ error: "Your cart is empty." });
    }
    const cartProducts = await Listing.find({ '_id': { $in: productIds } });
    
    // Create detailed tracking orders
    for (const prod of cartProducts) {
      const newOrder = new Order({
        buyer: req.user._id,
        seller: prod.owner,
        product: prod._id,
        price: prod.price,
        quantity: 1,
        shippingAddress: req.body.listing.address || req.user.address?.street || "No address provided",
        phone: req.body.listing.phone || req.user.phone || "9999999999",
        status: 'Pending',
        currentLocation: {
          name: "Seller Warehouse",
          latitude: prod.latitude || 27.56,
          longitude: prod.longitude || 80.68
        }
      });
      await newOrder.save();
    }

    user.order = [...user.order, ...cartProducts];
    user.cart = [];
    await user.save();
    res.json({
      success: true,
      message: "Purchased Successfully",
      user: { 
        username: user.username, 
        email: user.email, 
        role: user.role,
        cart: user.cart, 
        order: user.order 
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- LOGISTICS & ORDERS ENDPOINTS ---

// Fetch buyer orders
app.get("/orders", isLoggedIn, async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate("product")
      .populate("seller", "username email fullName role phone")
      .populate("transporter", "username email fullName phone")
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch seller orders
app.get("/seller/orders", isLoggedIn, async (req, res) => {
  try {
    const orders = await Order.find({ seller: req.user._id })
      .populate("product")
      .populate("buyer", "username email fullName role phone")
      .populate("transporter", "username email fullName phone")
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch transport requests for transporter
app.get("/transporter/jobs", isLoggedIn, async (req, res) => {
  try {
    if (req.user.role !== "transporter" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied." });
    }
    const orders = await Order.find({ status: "Transit Requested" })
      .populate("product")
      .populate("seller", "username email fullName role phone location latitude longitude")
      .populate("buyer", "username email fullName role phone")
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch transporter active orders
app.get("/transporter/active", isLoggedIn, async (req, res) => {
  try {
    if (req.user.role !== "transporter" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied." });
    }
    const orders = await Order.find({ transporter: req.user._id, status: { $in: ["In Transit", "Delivered"] } })
      .populate("product")
      .populate("seller", "username email fullName role phone")
      .populate("buyer", "username email fullName role phone")
      .sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seller accepts order
app.post("/orders/:id/accept", isLoggedIn, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }
    if (order.seller.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized." });
    }
    order.status = "Accepted";
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seller requests transit
app.post("/orders/:id/request-transit", isLoggedIn, async (req, res) => {
  try {
    const { vehicleType } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }
    if (order.seller.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized." });
    }
    order.status = "Transit Requested";
    order.vehicleType = vehicleType || "motorcycle";
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Transporter accepts job
app.post("/orders/:id/accept-delivery", isLoggedIn, async (req, res) => {
  try {
    if (req.user.role !== "transporter" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied." });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }
    order.transporter = req.user._id;
    order.status = "In Transit";
    order.currentLocation = {
      name: "Picked up by transporter",
      latitude: order.currentLocation?.latitude || 27.56,
      longitude: order.currentLocation?.longitude || 80.68
    };
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Transporter updates location and status
app.post("/orders/:id/track", isLoggedIn, async (req, res) => {
  try {
    const { status, locationName, latitude, longitude } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }
    
    const isTransporter = order.transporter && order.transporter.toString() === req.user._id.toString();
    const isSeller = order.seller.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin" || req.user.email === "freeforfire15@gmail.com";
    
    if (!isTransporter && !isSeller && !isAdmin) {
      return res.status(403).json({ error: "Unauthorized to update tracking details." });
    }
    
    if (status) order.status = status;
    if (locationName !== undefined) order.currentLocation.name = locationName;
    if (latitude !== undefined) order.currentLocation.latitude = latitude;
    if (longitude !== undefined) order.currentLocation.longitude = longitude;
    
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Buyer cancels order
app.post("/orders/:id/cancel", isLoggedIn, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }
    if (order.buyer.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized." });
    }
    if (order.status !== "Pending" && order.status !== "Accepted" && req.user.role !== "admin") {
      return res.status(400).json({ error: "Cannot cancel order once it is requested for transit or in transit." });
    }
    order.status = "Cancelled";
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Buyer reviews order product
app.post("/orders/:id/review", isLoggedIn, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }
    if (order.buyer.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized." });
    }
    
    order.review = {
      rating: Number(rating),
      comment: comment || "",
      createdAt: new Date()
    };
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Status checking route to verify auth session status
app.get("/auth-status", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: { 
        username: req.user.username, 
        email: req.user.email, 
        role: req.user.role,
        cart: req.user.cart, 
        order: req.user.order 
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Error handling route
app.use((err, req, res, next) => {
  console.error("Express Error Handler:", err);
  res.status(err.status || 500).json({ error: err.message || "Something went wrong on the server." });
});

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running at http://localhost:${port}`);
});
