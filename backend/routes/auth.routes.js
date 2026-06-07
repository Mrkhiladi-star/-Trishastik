const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { isLoggedIn } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require("../validators/auth");
const { otpLimiter } = require("../middleware/rateLimiter");

router.post("/register", validateBody(registerSchema), authController.register);
router.post("/login", validateBody(loginSchema), authController.login);
router.post("/logout", isLoggedIn, authController.logout);
router.post("/send-otp", otpLimiter, authController.sendOtp);
router.get("/auth-status", authController.authStatus);

router.post("/forgot-password", validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", validateBody(resetPasswordSchema), authController.resetPassword);

module.exports = router;
