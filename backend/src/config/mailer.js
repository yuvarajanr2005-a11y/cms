import nodemailer from "nodemailer";
import { env } from "./env.js";

let transporter = null;

const initTransporter = async () => {
  if (transporter) return transporter;

  if (env.SMTP_USER && env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    });
  } else {
    // Generate test ethereal account if SMTP not provided
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log("📧 Ethereal test mailer initialized. Test user:", testAccount.user);
    } catch (err) {
      console.warn("⚠️ Could not create Ethereal test account. Mailer fallback to console logging.", err.message);
      transporter = {
        sendMail: async (options) => {
          console.log("📨 [Email Console Fallback]", {
            to: options.to,
            subject: options.subject,
            text: options.text || options.html
          });
          return { messageId: "mock-email-" + Date.now() };
        }
      };
    }
  }

  return transporter;
};

/**
 * Sends an email
 * @param {object} options
 * @param {string} options.to
 * @param {string} options.subject
 * @param {string} [options.text]
 * @param {string} [options.html]
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const mailer = await initTransporter();
    const info = await mailer.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      text,
      html
    });

    const previewUrl = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null;
    if (previewUrl) {
      console.log(`✉️ Email preview available at: ${previewUrl}`);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    console.error("❌ Failed to send email to", to, error.message);
    return { success: false, error: error.message };
  }
};
