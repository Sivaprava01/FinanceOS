/**
 * Email Service
 * Handles all email sending operations using Nodemailer.
 * 
 * Supports:
 * - SMTP configuration for production
 * - Development-only mode (no email sending, tokens logged to console)
 */

import nodemailer from 'nodemailer';

// Check if SMTP is configured
const isSmtpConfigured = () => {
  return (
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD
  );
};

// Create transporter (only if SMTP is configured)
let transporter = null;

if (isSmtpConfigured()) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: parseInt(process.env.SMTP_PORT, 10) === 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  console.log('✉️ Email service initialized with SMTP configuration');
} else {
  if (process.env.NODE_ENV === 'development') {
    console.log('⚠️ SMTP not configured. Running in development-only mode.');
    console.log('   Email logs will appear in the console instead of being sent.');
    console.log('   To enable email sending, configure: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD');
  }
}

/**
 * Send a password reset email
 * @param {string} email - Recipient email address
 * @param {string} resetToken - The reset token (plaintext, not hashed)
 * @param {string} resetLink - The full reset link URL
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const sendPasswordResetEmail = async (email, resetToken, resetLink) => {
  try {
    const emailContent = `
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { background: #f9f9f9; padding: 30px; }
            .button { background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; margin: 20px 0; }
            .footer { background: #f0f0f0; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏦 FinanceOS</h1>
              <p>Password Reset Request</p>
            </div>
            
            <div class="content">
              <p>Hi,</p>
              
              <p>We received a request to reset your password for your FinanceOS account. If you didn't make this request, you can safely ignore this email.</p>
              
              <p><strong>To reset your password, click the button below:</strong></p>
              
              <a href="${resetLink}" class="button">Reset Password</a>
              
              <p style="font-size: 12px; color: #666;">
                Or copy and paste this link in your browser:<br/>
                <code style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px; word-break: break-all;">${resetLink}</code>
              </p>
              
              <div class="warning">
                <strong>⏱️ Important:</strong> This link expires in 30 minutes. After that, you'll need to request a new password reset.
              </div>
              
              <p><strong>Security note:</strong> We will never ask for your password via email. FinanceOS staff will never send you unsolicited password reset links.</p>
              
              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                Questions? <a href="${process.env.FRONTEND_URL}" style="color: #667eea; text-decoration: none;">Visit FinanceOS</a>
              </p>
            </div>
            
            <div class="footer">
              <p>© ${new Date().getFullYear()} FinanceOS. All rights reserved.</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // If SMTP is not configured, log to console in development
    if (!transporter) {
      if (process.env.NODE_ENV === 'development') {
        console.log('\n📧 ═══════════════════════════════════════════════════════════');
        console.log('   PASSWORD RESET EMAIL (Development Mode)');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`📧 To: ${email}`);
        console.log(`🔗 Reset Link: ${resetLink}`);
        console.log(`⏰ Token Expires: 30 minutes`);
        console.log('═══════════════════════════════════════════════════════════\n');
      }
      return { success: true, emailSent: false, devMode: true };
    }

    // Send the actual email
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@financeos.app',
      to: email,
      subject: 'Reset your FinanceOS password',
      html: emailContent,
      text: `Password Reset Request\n\nClick here to reset your password: ${resetLink}\n\nThis link expires in 30 minutes.\n\nIf you did not request this, please ignore this email.`,
    });

    console.log(`✉️ Password reset email sent to ${email} (Message ID: ${info.messageId})`);
    return { success: true, emailSent: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Verify that the email service is working (for health checks)
 * @returns {Promise<boolean>}
 */
export const verifyEmailService = async () => {
  if (!transporter) {
    return false; // Not configured
  }

  try {
    await transporter.verify();
    console.log('✅ Email service verified');
    return true;
  } catch (error) {
    console.error('❌ Email service verification failed:', error.message);
    return false;
  }
};

/**
 * Check if email service is available
 * @returns {boolean}
 */
export const isEmailServiceAvailable = () => {
  return transporter !== null;
};

export default {
  sendPasswordResetEmail,
  verifyEmailService,
  isEmailServiceAvailable,
  isSmtpConfigured,
};
