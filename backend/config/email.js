const nodemailer = require("nodemailer");

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

let transporter = null;
console.log("EMAIL_USER =", emailUser);
console.log("EMAIL_PASS_LENGTH =", emailPass?.length);

if (emailUser && emailPass) {
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });

  // Verify connection configuration on startup
  transporter.verify((error, success) => {
    if (error) {
      console.error("Nodemailer transporter verification failed:", error.message);
    } else {
      console.log("Nodemailer transporter verified successfully. Ready to send emails.");
    }
  });
} else {
  console.warn("EMAIL_USER and/or EMAIL_PASS environment variables are not configured. Nodemailer is disabled.");
}

module.exports = transporter;
