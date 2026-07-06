const nodemailer = require("nodemailer");
require("dotenv").config(); // loads .env from current directory

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;

console.log("Testing Nodemailer config...");
console.log("EMAIL_USER:", emailUser);
console.log("EMAIL_PASS length:", emailPass ? emailPass.length : 0);

if (!emailUser || !emailPass) {
  console.error("Missing environment variables!");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: emailUser,
    pass: emailPass
  }
});

transporter.sendMail({
  from: `"Test" <${emailUser}>`,
  to: emailUser,
  subject: "SMTP Connection Test",
  text: "Nodemailer is working correctly!"
})
.then(info => {
  console.log("SUCCESS! Message sent successfully:", info.messageId);
  process.exit(0);
})
.catch(err => {
  console.error("ERROR SENDING EMAIL:", err);
  process.exit(1);
});
