const Joi = require("joi");

const registerSchema = Joi.object({
  username: Joi.string().pattern(/^[a-zA-Z0-9_.]+$/).min(3).max(30).required().messages({
    "string.pattern.base": "Username can only contain alphanumeric characters, underscores, and periods."
  }),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("customer", "farmer", "admin", "agent", "fertilizer_seller", "instrument_seller", "transporter", "fertilizerSeller", "equipmentSeller", "fieldAgent").optional(),
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  newPassword: Joi.string().min(6).required(),
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
