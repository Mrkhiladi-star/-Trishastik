const resendClient = require("../config/resend");
const nodemailerTransporter = require("../config/email");
const logger = require("../utils/logger");

const logFallback = (email, subject, htmlContent) => {
  if (process.env.NODE_ENV !== "production") {
    console.log("-----------------------------------------");
    console.log(`[DEVELOPMENT EMAIL FALLBACK]`);
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body excerpt: ${htmlContent.replace(/<[^>]*>/g, '').substring(0, 300).trim()}...`);
    console.log("-----------------------------------------");
  }
};

const sendMailHelper = async (email, subject, htmlContent) => {
  if (nodemailerTransporter) {
    try {
      console.log(`Sending email via Nodemailer SMTP to ${email}...`);
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
      logFallback(email, subject, htmlContent);
    }
  } else if (resendClient) {
    try {
      console.log(`Sending email via Resend to ${email}...`);
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
      logFallback(email, subject, htmlContent);
    }
  } else {
    logger.warn(`No email provider (Nodemailer or Resend) is configured. Email not sent to ${email}`);
    logFallback(email, subject, htmlContent);
  }
};

const sendOtpEmail = async (email, otp) => {
  const subject = "Trishastik - Verify Your Account";
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #0f172a; color: #f8fafc;">
      <h2 style="color: #10b981; text-align: center;">Welcome to Trishastik</h2>
      <p>Hello,</p>
      <p>Thank you for registering. Please use the following 6-digit One-Time Password (OTP) to verify your email address and complete registration:</p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b; background-color: #f1f5f9; padding: 12px 24px; border-radius: 8px; border: 1px solid #cbd5e1;">${otp}</span>
      </div>
      <p>This code is valid for 10 minutes. If you did not request this code, please ignore this email.</p>
      <hr style="border: 0; border-top: 1px solid #334155; margin: 30px 0;" />
      <p style="font-size: 12px; color: #64748b; text-align: center;">&copy; ${new Date().getFullYear()} Trishastik. All rights reserved.</p>
    </div>
  `;

  // Always log OTP in non-production
  if (process.env.NODE_ENV !== "production") {
    console.log("-----------------------------------------");
    console.log(`[DEVELOPMENT OTP] Code for ${email} is: ${otp}`);
    console.log("-----------------------------------------");
  }

  await sendMailHelper(email, subject, htmlContent);
};

const sendRentalDeliveryEmail = async (
  email,
  buyerName,
  sellerName,
  productName,
  startDateStr,
  endDateStr,
  durationDays,
  dailyPrice
) => {
  const subject = `[Trishastik Hub] Rented Equipment Delivered - Return Policy & Dates`;
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #0f172a; color: #f8fafc;">
      <h2 style="color: #10b981; text-align: center;">Rental Period Commenced</h2>
      <p>Hello <strong>${buyerName}</strong>,</p>
      <p>Your rented equipment, <strong>${productName}</strong>, has been successfully delivered by the transporter.</p>
      
      <div style="background-color: #1e293b; padding: 15px; border-radius: 8px; border: 1px solid #334155; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #10b981;">Rental Details</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #cbd5e1;">
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Equipment Provider:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right;">${sellerName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Start Date:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right;">${startDateStr}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Rental Duration:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right;">${durationDays} Days</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Return Due Date:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #f59e0b;">${endDateStr}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;">Daily Rate:</td>
            <td style="padding: 6px 0; font-weight: bold; text-align: right;">₹${dailyPrice} / day</td>
          </tr>
        </table>
      </div>
      
      <div style="color: #fca5a5; font-size: 13px; font-weight: bold; background-color: rgba(127,29,29,0.2); border: 1px dashed #ef4444; padding: 12px; border-radius: 8px; margin-top: 15px;">
        ⚠️ IMPORTANT RETURN POLICY: You are expected to return the equipment in the same working condition by ${endDateStr}. If you return the equipment late, overdue fee charges will be applied automatically at 1.5x the standard daily rate.
      </div>
      
      <p style="margin-top: 20px;">Once you are finished using the equipment, please log into your Trishastik Hub account and click <strong>Initiate Return</strong> in your purchases tab.</p>
      
      <hr style="border: 0; border-top: 1px solid #334155; margin: 30px 0;" />
      <p style="font-size: 11px; color: #64748b; text-align: center;">&copy; ${new Date().getFullYear()} Trishastik Hub. All rights reserved.</p>
    </div>
  `;

  await sendMailHelper(email, subject, htmlContent);
};

const sendRentalReturnConfirmationEmail = async (
  email,
  buyerName,
  sellerName,
  productName,
  lateDays,
  overdueCharges
) => {
  const subject = `[Trishastik Hub] Equipment Return Confirmed`;
  
  let feeSummaryHtml = `<p style="color: #10b981; font-weight: bold;">The equipment was returned on time. No overdue charges have been logged.</p>`;
  if (lateDays > 0) {
    feeSummaryHtml = `
      <div style="background-color: rgba(239,68,68,0.1); border: 1px solid #ef4444; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <h4 style="margin-top: 0; color: #ef4444;">Overdue Rental Charges</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #cbd5e1;">
          <tr>
            <td style="padding: 4px 0; color: #94a3b8;">Days Overdue:</td>
            <td style="padding: 4px 0; font-weight: bold; text-align: right; color: #ef4444;">${lateDays} Days</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #94a3b8;">Overdue Late Fee (1.5x rate):</td>
            <td style="padding: 4px 0; font-weight: bold; text-align: right; color: #ef4444;">₹${overdueCharges}</td>
          </tr>
        </table>
      </div>
    `;
  }

  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #0f172a; color: #f8fafc;">
      <h2 style="color: #10b981; text-align: center;">Equipment Return Confirmed</h2>
      <p>Hello <strong>${buyerName}</strong>,</p>
      <p>This email confirms that the equipment owner (<strong>${sellerName}</strong>) has received and confirmed the return of <strong>${productName}</strong>.</p>
      
      ${feeSummaryHtml}
      
      <p>Thank you for using Trishastik Hub for your agricultural equipment rental needs. We hope to serve you again soon.</p>
      
      <hr style="border: 0; border-top: 1px solid #334155; margin: 30px 0;" />
      <p style="font-size: 11px; color: #64748b; text-align: center;">&copy; ${new Date().getFullYear()} Trishastik Hub. All rights reserved.</p>
    </div>
  `;

  await sendMailHelper(email, subject, htmlContent);
};

const sendOrderCancellationTransporterExhaustedEmail = async (email, buyerName, productName, orderId) => {
  const subject = `[Trishastik Hub] Delivery Unserviceable - Order #${orderId} Cancelled`;
  const htmlContent = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #0f172a; color: #f8fafc;">
      <h2 style="color: #ef4444; text-align: center;">Delivery Unserviceable - Order Cancelled</h2>
      <p>Hello <strong>${buyerName}</strong>,</p>
      <p>We regret to inform you that we are unable to match a delivery transporter for your location to ship <strong>${productName}</strong> (Order ID: #${orderId}).</p>
      <p>As a result, your order has been cancelled, and a **full refund** has been automatically processed back to your original payment method.</p>
      <div style="background-color: #1e293b; padding: 15px; border-radius: 8px; border: 1px solid #334155; margin: 20px 0; text-align: center;">
        <p style="margin: 0; color: #ef4444; font-weight: bold;">Order Status: Cancelled</p>
        <p style="margin: 5px 0 0 0; color: #cbd5e1; font-size: 13px;">Refund Status: Processed via Razorpay</p>
      </div>
      <p>The refunded amount should reflect in your account within 5-7 business days depending on your bank.</p>
      <p style="margin-top: 20px;">We apologize for the inconvenience caused.</p>
      <hr style="border: 0; border-top: 1px solid #334155; margin: 30px 0;" />
      <p style="font-size: 11px; color: #64748b; text-align: center;">&copy; ${new Date().getFullYear()} Trishastik Hub. All rights reserved.</p>
    </div>
  `;
  await sendMailHelper(email, subject, htmlContent);
};

module.exports = {
  sendOtpEmail,
  sendRentalDeliveryEmail,
  sendRentalReturnConfirmationEmail,
  sendOrderCancellationTransporterExhaustedEmail
};
