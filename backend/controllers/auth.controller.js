const passport = require("passport");
const User = require("../models/user");
const authService = require("../services/auth.service");
const logger = require("../utils/logger");

const normalizeRole = (role) => {
  if (!role) return "customer";
  const mapping = {
    fertilizerSeller: "fertilizer_seller",
    equipmentSeller: "instrument_seller",
    fieldAgent: "agent",
  };
  return mapping[role] || role;
};

const register = async (req, res, next) => {
  try {
    const { username, email, password, role, otp } = req.body;
    const normalizedRole = normalizeRole(role);

    // 1. Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser && existingUser.isEmailVerified) {
      return res.status(400).json({ error: "Username or email is already registered." });
    }

    // 2. If OTP is not provided, trigger OTP generation & send it
    if (!otp && process.env.NODE_ENV !== "test") {
      await authService.generateOtp(email);
      return res.json({
        success: true,
        otpRequired: true,
        message: "A verification code has been sent to your email.",
      });
    }

    // 3. OTP is provided - Verify it
    if (process.env.NODE_ENV !== "test") {
      const isOtpValid = await authService.verifyOtp(email, otp);
      if (!isOtpValid) {
        return res.status(400).json({ error: "Invalid or expired verification code." });
      }
    }

    // 4. Register the user
    // If the unverified user document already exists, clean it up before registering
    if (existingUser) {
      await User.deleteOne({ _id: existingUser._id });
    }

    const newUser = new User({
      email,
      username,
      role: normalizedRole,
      isEmailVerified: true,
    });

    const registeredUser = await User.register(newUser, password);
    
    // Auto-seed default vehicle for transporters
    if (registeredUser.role === "transporter") {
      try {
        const Vehicle = require("../models/vehicle");
        const defaultVehicle = new Vehicle({
          transporter: registeredUser._id,
          vehicleType: "two-wheeler",
          registrationNumber: "MH-12-AB-" + Math.floor(1000 + Math.random() * 9000),
          capacityKg: 150,
          pricePerKm: 15,
          minCharge: 50,
          loadingCharge: 100,
          isAvailable: true
        });
        await defaultVehicle.save();
        logger.info(`Auto-seeded default vehicle for newly registered transporter: ${username}`);
      } catch (vehErr) {
        logger.error(`Error auto-seeding vehicle for transporter ${username}:`, vehErr);
      }
    }
    
    // Log in user automatically after verification
    req.login(registeredUser, (err) => {
      if (err) return next(err);
      
      logger.info(`User registered successfully: ${username}`);
      res.json({
        success: true,
        user: {
          username: registeredUser.username,
          email: registeredUser.email,
          role: registeredUser.role,
          isProfileComplete: registeredUser.isProfileComplete,
          profilePhoto: registeredUser.profilePhoto,
          fullName: registeredUser.fullName,
          phone: registeredUser.phone,
          address: registeredUser.address,
          cart: registeredUser.cart,
          order: registeredUser.order,
        },
      });
    });
  } catch (err) {
    logger.error("Registration error:", err);
    res.status(400).json({ error: err.message });
  }
};

const sendOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }
    await authService.generateOtp(email);
    res.json({ success: true, message: "Verification code sent." });
  } catch (err) {
    next(err);
  }
};

const login = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ error: info ? info.message : "Authentication failed" });
    }
    req.login(user, (err) => {
      if (err) return next(err);
      
      logger.info(`User logged in: ${user.username}`);
      return res.json({
        success: true,
        user: {
          username: user.username,
          email: user.email,
          role: user.role,
          isProfileComplete: user.isProfileComplete,
          profilePhoto: user.profilePhoto,
          fullName: user.fullName,
          phone: user.phone,
          address: user.address,
          cart: user.cart,
          order: user.order,
        },
      });
    });
  })(req, res, next);
};

const logout = (req, res, next) => {
  if (!req.user) {
    return res.json({ success: true, message: "You are already logged out." });
  }
  const username = req.user.username;
  req.logout((err) => {
    if (err) return next(err);
    logger.info(`User logged out: ${username}`);
    res.json({ success: true, message: "You are now logged out!" });
  });
};

const authStatus = (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: {
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        isProfileComplete: req.user.isProfileComplete,
        profilePhoto: req.user.profilePhoto,
        fullName: req.user.fullName,
        phone: req.user.phone,
        address: req.user.address,
        cart: req.user.cart,
        order: req.user.order,
      },
    });
  } else {
    res.json({ authenticated: false });
  }
};

const adminGetAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}, "username email fullName role phone farmingInfo landDetails");
    res.json({ users });
  } catch (err) {
    next(err);
  }
};

const adminUpdateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    user.role = normalizeRole(role);
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "No account found with this email address." });
    }
    
    await authService.generateOtp(email);
    logger.info(`Forgot password OTP generated for email: ${email}`);
    res.json({ success: true, message: "Verification code sent to your email." });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    const isOtpValid = await authService.verifyOtp(email, otp);
    if (!isOtpValid) {
      return res.status(400).json({ error: "Invalid or expired verification code." });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    
    await user.setPassword(newPassword);
    await user.save();
    
    logger.info(`Password successfully reset for user: ${user.username}`);
    res.json({ success: true, message: "Password updated successfully! Please sign in with your new password." });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  sendOtp,
  login,
  logout,
  authStatus,
  adminGetAllUsers,
  adminUpdateUserRole,
  forgotPassword,
  resetPassword,
};
