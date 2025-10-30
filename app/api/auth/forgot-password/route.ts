import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail } from '@/lib/server/users';
import { storeResetToken } from '@/lib/reset-tokens';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// SMTP configuration from environment variables
const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
};

const fromEmail = process.env.SMTP_FROM;

export async function POST(req: NextRequest) {
  // Validate SMTP configuration
  if (!smtpConfig.host || !smtpConfig.auth.user || !smtpConfig.auth.pass || !fromEmail) {
    console.error("Missing SMTP configuration environment variables.");
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    // Check if user exists
    const user = await findUserByEmail(email);
    if (!user) {
      // For security, don't reveal if user exists or not
      return NextResponse.json({ 
        message: 'If an account with that email exists, we have sent a password reset link.' 
      }, { status: 200 });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in memory (temporary solution)
    storeResetToken(user.email, resetToken, 60); // 60 minutes expiry

    // Create transporter
    const transporter = nodemailer.createTransport(smtpConfig);

    // Verify connection configuration
    await transporter.verify();

    // Create reset link
    const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;

    // Email content
    const mailOptions = {
      from: `"HealthConsultant" <${fromEmail}>`,
      to: email,
      subject: 'Password Reset Request - HealthConsultant',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8856ff; border-bottom: 2px solid #8856ff; padding-bottom: 10px;">
            Password Reset Request
          </h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>Hello ${user.firstName || 'User'},</p>
            <p>We received a request to reset your password for your HealthConsultant account.</p>
          </div>
          
          <div style="background: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px; text-align: center;">
            <p style="margin-bottom: 20px;">Click the button below to reset your password:</p>
            <a href="${resetLink}" 
               style="background: linear-gradient(90deg, #8856ff, #a854ff); 
                      color: white; 
                      padding: 12px 24px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: 600;
                      display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <div style="margin-top: 30px; padding: 15px; background: #e8f4fd; border-radius: 8px; border-left: 4px solid #8856ff;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              <strong>Important:</strong> This link will expire in 1 hour for security reasons.
              If you didn't request this password reset, please ignore this email.
            </p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
            <p style="margin: 0; color: #666; font-size: 12px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetLink}" style="color: #8856ff; word-break: break-all;">${resetLink}</a>
            </p>
          </div>
        </div>
      `,
      text: `
Password Reset Request

Hello ${user.firstName || 'User'},

We received a request to reset your password for your HealthConsultant account.

Click the link below to reset your password:
${resetLink}

This link will expire in 1 hour for security reasons.
If you didn't request this password reset, please ignore this email.

---
HealthConsultant Team
      `,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Password reset email sent successfully:', info.messageId);

    return NextResponse.json({ 
      message: 'If an account with that email exists, we have sent a password reset link.',
      messageId: info.messageId 
    });

  } catch (error) {
    console.error("Password reset email error:", error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('authentication')) {
        return NextResponse.json({ error: 'Email authentication failed. Please check SMTP credentials.' }, { status: 500 });
      } else if (error.message.includes('connection')) {
        return NextResponse.json({ error: 'Unable to connect to email server.' }, { status: 500 });
      }
    }
    
    return NextResponse.json({ error: 'Failed to send password reset email. Please try again later.' }, { status: 500 });
  }
}
