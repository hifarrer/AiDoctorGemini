import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

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
const toEmail = process.env.SMTP_USER; // Send to the same email as the SMTP user

export async function POST(req: NextRequest) {
  // Validate SMTP configuration
  if (!smtpConfig.host || !smtpConfig.auth.user || !smtpConfig.auth.pass || !fromEmail || !toEmail) {
    console.error("Missing SMTP configuration environment variables.");
    return NextResponse.json({ error: "Server configuration error." }, { status: 500 });
  }

  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    // Create transporter
    const transporter = nodemailer.createTransport(smtpConfig);

    // Verify connection configuration
    await transporter.verify();

    // Email content
    const mailOptions = {
      from: `"HealthConsultant Contact Form" <${fromEmail}>`,
      to: toEmail,
      replyTo: email,
      subject: `New Contact Form Message from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8856ff; border-bottom: 2px solid #8856ff; padding-bottom: 10px;">
            New Contact Form Message
          </h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Contact Details</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #8856ff;">${email}</a></p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="background: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">Message</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
          </div>
          
          <div style="margin-top: 30px; padding: 15px; background: #e8f4fd; border-radius: 8px; border-left: 4px solid #8856ff;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              This message was sent from the HealthConsultant contact form. 
              You can reply directly to this email to respond to ${name}.
            </p>
          </div>
        </div>
      `,
      text: `
New Contact Form Message

Name: ${name}
Email: ${email}
Date: ${new Date().toLocaleString()}

Message:
${message}

---
This message was sent from the HealthConsultant contact form.
You can reply directly to this email to respond to ${name}.
      `,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', info.messageId);

    return NextResponse.json({ 
      message: 'Message sent successfully!',
      messageId: info.messageId 
    });

  } catch (error) {
    console.error("Email sending error:", error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('authentication')) {
        return NextResponse.json({ error: 'Email authentication failed. Please check SMTP credentials.' }, { status: 500 });
      } else if (error.message.includes('connection')) {
        return NextResponse.json({ error: 'Unable to connect to email server.' }, { status: 500 });
      }
    }
    
    return NextResponse.json({ error: 'Failed to send message. Please try again later.' }, { status: 500 });
  }
} 