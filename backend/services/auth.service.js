const User = require("../models/user");
const { setCache, getCache, delCache } = require("./redis.service");
const { sendOtpEmail } = require("./email.service");
const logger = require("../utils/logger");

const generateOtp = async (email) => {
  // Generate random 6-digit numeric OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Save OTP with prefix in cache (Expires in 10 minutes)
  const cacheKey = `otp:${email}`;
  await setCache(cacheKey, otp, 600);
  
  // Dispatch OTP email
  await sendOtpEmail(email, otp);
  
  logger.info(`Generated and stored OTP for email: ${email}`);
  return otp;
};

const verifyOtp = async (email, otp) => {
  const cacheKey = `otp:${email}`;
  const storedOtp = await getCache(cacheKey);
  
  if (!storedOtp) {
    logger.warn(`OTP verification attempt failed: OTP expired or not found for ${email}`);
    return false;
  }
  
  if (storedOtp !== otp) {
    logger.warn(`OTP verification attempt failed: Invalid OTP entered for ${email}`);
    return false;
  }
  
  // OTP verified successfully, clear cache
  await delCache(cacheKey);
  logger.info(`OTP verified successfully for email: ${email}`);
  return true;
};

module.exports = {
  generateOtp,
  verifyOtp,
};
