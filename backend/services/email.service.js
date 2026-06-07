const resendClient = require("../config/resend");
const nodemailerTransporter = require("../config/email");
const logger = require("../utils/logger");

const sendOtpEmail = async (email, otp) => {
  const subject = "Trishastik - Verify Your Account";
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
      <h2 style="color: #10b981; text-align: center;">Welcome to Trishastik</h2>
      <p>Hello,</p>
      <p>Thank you for registering. Please use the following 6-digit One-Time Password (OTP) to verify your email address and complete registration:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b; background-color: #f1f5f9; padding: 12px 24px; border-radius: 8px; border: 1px solid #cbd5e1;">${otp}</span>
      </div>
      <p>This code is valid for 10 minutes. If you did not request this code, please ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
      <p style="font-size: 12px; color: #64748b; text-align: center;">&copy; ${new Date().getFullYear()} Trishastik. All rights reserved.</p>
    </div>
  `;

  // Always print the OTP to the console in non-production environments to avoid sandbox email blocks
  if (process.env.NODE_ENV !== "production") {
    console.log("-----------------------------------------");
    console.log(`[DEVELOPMENT OTP] Code for ${email} is: ${otp}`);
    console.log("-----------------------------------------");
  }

  // Service Provider Abstraction:
  // If Nodemailer is configured (user & pass provided), it will be used as the primary driver.
  // Otherwise, if Resend is configured, it will use Resend.
  if (nodemailerTransporter) {
    try {
      console.log(`Sending OTP email via Nodemailer SMTP to ${email}...`);
      const info = await nodemailerTransporter.sendMail({
        from: `"Trishastik" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: subject,
        html: htmlContent,
      });
      console.log(`Email sent successfully via Nodemailer. Message ID: ${info.messageId}`);
      logger.info(`Email sent successfully via Nodemailer to ${email}`);
    } catch (err) {
      console.error("Nodemailer error sending email:", err.message);
      logger.error("Nodemailer sending failed:", err);
      if (process.env.NODE_ENV === "production") {
        console.log("-----------------------------------------");
        console.log(`[FALLBACK] OTP for ${email} is: ${otp}`);
        console.log("-----------------------------------------");
      }
    }
  } else if (resendClient) {
    try {
      console.log(`Sending OTP email via Resend to ${email}...`);
      const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
      await resendClient.emails.send({
        from: `Trishastik <${fromEmail}>`,
        to: email,
        subject: subject,
        html: htmlContent,
      });
      console.log(`Email sent successfully via Resend to ${email}`);
      logger.info(`Email sent successfully via Resend to ${email}`);
    } catch (err) {
      console.error("Resend API error sending email:", err.message);
      logger.error("Resend sending failed:", err);
      if (process.env.NODE_ENV === "production") {
        console.log("-----------------------------------------");
        console.log(`[FALLBACK] OTP for ${email} is: ${otp}`);
        console.log("-----------------------------------------");
      }
    }
  } else {
    logger.warn(`No email provider (Nodemailer or Resend) is configured. OTP not sent to ${email}`);
    if (process.env.NODE_ENV === "production") {
      console.log("-----------------------------------------");
      console.log(`[CONSOLE LOG] OTP for ${email} is: ${otp}`);
      console.log("-----------------------------------------");
    }
  }
};

module.exports = {
  sendOtpEmail,
};
