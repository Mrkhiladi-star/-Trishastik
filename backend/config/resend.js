const { Resend } = require("resend");

const apiKey = process.env.RESEND_API_KEY;
let resendClient = null;

if (apiKey) {
  resendClient = new Resend(apiKey);
  console.log("Resend email service initialized successfully.");
} else {
  console.log("RESEND_API_KEY is not configured. Email OTPs will be printed to the console.");
}

module.exports = resendClient;
