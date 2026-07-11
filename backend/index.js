require("dotenv").config();

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const cors = require("cors");

const connectDB = require("./config/db");
const User = require("./models/user");
const routes = require("./routes");
const errorHandler = require("./middleware/error");
const logger = require("./utils/logger");
const { uploadDir } = require("./config/multer");

// Connect to Database
connectDB();

// Database startup repair for stuck transit requests
const Order = require("./models/order");
const WeightRule = require("./models/weightRule");
const CategoryMarkup = require("./models/categoryMarkup");
mongoose.connection.once("open", async () => {
  try {
    const result = await Order.updateMany(
      { status: "Transit Requested", transporter: null },
      { $set: { status: "Accepted" } }
    );
    if (result.modifiedCount > 0) {
      logger.info(`Startup Repair: Reset ${result.modifiedCount} stuck transit requests back to "Accepted".`);
    }

    // Seed dynamic weight rules if empty
    const countRules = await WeightRule.countDocuments();
    if (countRules === 0) {
      await WeightRule.insertMany([
        { minWeightKg: 0, maxWeightKg: 30, vehicleType: "two-wheeler", displayName: "Two Wheeler" },
        { minWeightKg: 30, maxWeightKg: 150, vehicleType: "three-wheeler", displayName: "Three Wheeler" },
        { minWeightKg: 150, maxWeightKg: 1000, vehicleType: "pickup", displayName: "Mini Pickup" },
        { minWeightKg: 1000, maxWeightKg: 3000, vehicleType: "mini-truck", displayName: "Small Truck" },
        { minWeightKg: 3000, maxWeightKg: 10000, vehicleType: "large-truck", displayName: "Large Truck" },
        { minWeightKg: 10000, maxWeightKg: 999999, vehicleType: "container", displayName: "Heavy Truck" }
      ]);
      logger.info("Database Seeding: Default weight rules seeded successfully.");
    }

    // Seed default markup percentages if empty
    const countMarkups = await CategoryMarkup.countDocuments();
    if (countMarkups === 0) {
      await CategoryMarkup.insertMany([
        { category: "organic_product", markupPercentage: 1 },
        { category: "medicine_fertilizer", markupPercentage: 5 },
        { category: "instrument_sale", markupPercentage: 6 },
        { category: "instrument_rent", markupPercentage: 8 }
      ]);
      logger.info("Database Seeding: Default category markups seeded successfully.");
    }
  } catch (err) {
    logger.error("Startup Repair / Seeding error:", err);
  }
});

// Initialize and verify Email SMTP Transporter
require("./config/email");

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
  logger.error("ERROR in MONGO SESSION STORE", err);
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
    secure: false, // Set to true if running behind HTTPS in production
  },
};

// Express Middlewares
app.use(session(sessionOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Passport Configuration
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
  res.locals.currUser = req.user;
  next();
});



// Mount Modular Routes
app.use("/", routes);

// Global Centralized Error Handler
app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, "0.0.0.0", () => {
  logger.info(`Server is running at http://localhost:${port}`);
  console.log(`Server is running at http://localhost:${port}`);
});

// Start background check for expired transit assignments
const Vehicle = require("./models/vehicle");
const { getDistanceKm, VEHICLE_MAPPING } = require("./utils/distance");

async function assignNextTransporter(order) {
  const currentIndex = order.currentCandidateIndex;
  
  if (order.transitCandidates && order.transitCandidates[currentIndex]) {
    if (order.transitCandidates[currentIndex].status === 'Pending') {
      order.transitCandidates[currentIndex].status = 'Rejected';
      order.transitCandidates[currentIndex].updatedAt = new Date();
    }
  }

  const nextIndex = currentIndex + 1;
  order.currentCandidateIndex = nextIndex;

  if (order.transitCandidates && nextIndex < order.transitCandidates.length) {
    const nextCandidate = order.transitCandidates[nextIndex];
    order.transporter = nextCandidate.transporter;
    order.deliveryPrice = nextCandidate.price;
    order.requestExpiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
    await order.save();
    logger.info(`Reassigned Order ${order._id} to next candidate (Index: ${nextIndex})`);
  } else {
    if (order.transitRadius === 50) {
      logger.info(`Exhausted 50KM candidates for Order ${order._id}. Expanding search to 100KM...`);
      order.transitRadius = 100;
      
      const populatedOrder = await Order.findById(order._id)
        .populate('buyer')
        .populate('seller');
        
      if (!populatedOrder) return;
      
      const sellerLat = populatedOrder.seller?.latitude || populatedOrder.currentLocation?.latitude || 27.56;
      const sellerLon = populatedOrder.seller?.longitude || populatedOrder.currentLocation?.longitude || 80.68;
      const buyerLat = populatedOrder.buyer?.latitude || 27.56;
      const buyerLon = populatedOrder.buyer?.longitude || 80.68;
      
      const distDelivery = Math.max(getDistanceKm(sellerLat, sellerLon, buyerLat, buyerLon), 1);
      const transporters = await User.find({ role: "transporter" });
      
      const newCandidates = [];
      for (const trans of transporters) {
        const transLat = trans.latitude || 27.56;
        const transLon = trans.longitude || 80.68;
        const distToSeller = getDistanceKm(transLat, transLon, sellerLat, sellerLon);
        
        if (distToSeller <= 100) {
          const matchingTypes = VEHICLE_MAPPING[populatedOrder.vehicleType] || ["two-wheeler"];
          let vehicle = await Vehicle.findOne({
            transporter: trans._id,
            vehicleType: { $in: matchingTypes },
            isAvailable: true
          });
          
          if (!vehicle) {
            const anyVehicle = await Vehicle.findOne({ transporter: trans._id });
            if (!anyVehicle) {
              vehicle = new Vehicle({
                transporter: trans._id,
                vehicleType: matchingTypes[0] || "two-wheeler",
                registrationNumber: "TEMP-" + trans._id.toString().substring(18).toUpperCase(),
                capacityKg: 150,
                isAvailable: true,
                pricePerKm: 15,
                minCharge: 50,
                loadingCharge: 100
              });
              await vehicle.save();
            } else if (anyVehicle.isAvailable && matchingTypes.includes(anyVehicle.vehicleType)) {
              vehicle = anyVehicle;
            }
          }
          
          if (vehicle && vehicle.isAvailable && matchingTypes.includes(vehicle.vehicleType)) {
            const price = vehicle.minCharge + (vehicle.pricePerKm * distDelivery) + vehicle.loadingCharge;
            newCandidates.push({
              transporter: trans._id,
              price: Math.round(price),
              distanceToSeller: Math.round(distToSeller * 10) / 10,
              distanceBuyerSeller: Math.round(distDelivery * 10) / 10,
              status: 'Pending',
              updatedAt: new Date()
            });
          }
        }
      }
      
      newCandidates.sort((a, b) => a.price - b.price);
      
      const alreadyTriedIds = order.transitCandidates.map(c => c.transporter.toString());
      const filteredNewCandidates = newCandidates.filter(c => !alreadyTriedIds.includes(c.transporter.toString()));
      
      if (filteredNewCandidates.length > 0) {
        order.transitCandidates = [...order.transitCandidates, ...filteredNewCandidates];
        const nextCandidate = order.transitCandidates[nextIndex];
        order.transporter = nextCandidate.transporter;
        order.deliveryPrice = nextCandidate.price;
        order.requestExpiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
        await order.save();
        logger.info(`Reassigned Order ${order._id} to first 100KM candidate`);
      } else {
        order.transporter = null;
        order.deliveryPrice = 0;
        order.requestExpiresAt = null;
        await order.save();
        logger.warn(`No transporters found in 100KM radius for Order ${order._id}`);
      }
    } else {
      order.transporter = null;
      order.deliveryPrice = 0;
      order.requestExpiresAt = null;
      await order.save();
      logger.warn(`Exhausted all candidates in 100KM radius for Order ${order._id}.`);
    }
  }
}

async function checkExpiredTransitRequests() {
  try {
    const expiredOrders = await Order.find({
      status: "Transit Requested",
      transporter: { $ne: null },
      requestExpiresAt: { $lt: new Date() }
    });
    
    for (const order of expiredOrders) {
      logger.info(`Order ${order._id} request expired. Reassigning...`);
      const idx = order.currentCandidateIndex;
      if (order.transitCandidates && order.transitCandidates[idx]) {
        order.transitCandidates[idx].status = 'Timeout';
        order.transitCandidates[idx].updatedAt = new Date();
      }
      await assignNextTransporter(order);
    }
  } catch (err) {
    logger.error("Background checking exception:", err);
  }
}

setInterval(checkExpiredTransitRequests, 60000);
