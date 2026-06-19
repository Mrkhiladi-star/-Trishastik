if (process.env.NODE_ENV !== "production") {
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

const connectDB = require("./config/db");
const User = require("./models/user");
const routes = require("./routes");
const errorHandler = require("./middleware/error");
const logger = require("./utils/logger");
const { uploadDir } = require("./config/multer");

// Connect to Database
connectDB();

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
