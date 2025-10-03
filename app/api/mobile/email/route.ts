import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { findUserById } from '@/lib/server/users';

// CORS configuration for Expo development
const getAllowedOrigin = (request: NextRequest): string => {
  const origin = request.headers.get('origin');
  
  console.log('🔍 CORS Debug - Request origin:', origin);
  
  // Check if origin matches any allowed pattern
  if (origin) {
    // Check for localhost
    if (origin?.includes('localhost:8081')) {
      console.log('✅ CORS - Allowing localhost origin:', origin);
      return origin;
    }
    
    // Check for Expo tunnel URLs
    if (origin?.includes('.exp.direct')) {
      console.log('✅ CORS - Allowing Expo tunnel origin:', origin);
      return origin;
    }
  }
  
  // Default fallback
  console.log('⚠️ CORS - Using fallback origin for:', origin);
  return 'http://localhost:8081';
};

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
const toEmail = 'contact@healthconsultant.ai';

export async function POST(request: NextRequest) {
  try {
    // Parse JSON body
    const { user_id, email, message } = await request.json();

    // Validate required parameters
    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': getAllowedOrigin(request),
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': getAllowedOrigin(request),
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': getAllowedOrigin(request),
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }

    // Validate that user exists in database
    const user = await findUserById(user_id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { 
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': getAllowedOrigin(request),
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }

    // Validate SMTP configuration
    if (!smtpConfig.host || !smtpConfig.auth.user || !smtpConfig.auth.pass || !fromEmail || !toEmail) {
      console.error("Missing SMTP configuration environment variables.");
      return NextResponse.json({ error: "Server configuration error." }, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': getAllowedOrigin(request),
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }

    console.log(`📧 Mobile email request from user ${user_id} (${user.email}): ${message.substring(0, 100)}...`);

    // Create transporter
    const transporter = nodemailer.createTransport(smtpConfig);

    // Verify connection configuration
    await transporter.verify();

    // Email content
    const mailOptions = {
      from: `"HealthConsultant Mobile App" <${fromEmail}>`,
      to: toEmail,
      replyTo: email,
      subject: 'App Message from User',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8856ff; border-bottom: 2px solid #8856ff; padding-bottom: 10px;">
            App Message from User
          </h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">User Details</h3>
            <p><strong>User ID:</strong> ${user_id}</p>
            <p><strong>User Email:</strong> <a href="mailto:${user.email}" style="color: #8856ff;">${user.email}</a></p>
            <p><strong>Reply Email:</strong> <a href="mailto:${email}" style="color: #8856ff;">${email}</a></p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="background: #fff; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
            <h3 style="color: #333; margin-top: 0;">Message</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
          </div>
          
          <div style="margin-top: 30px; padding: 15px; background: #e8f4fd; border-radius: 8px; border-left: 4px solid #8856ff;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              This message was sent from the HealthConsultant mobile app. 
              You can reply directly to this email to respond to the user.
            </p>
          </div>
        </div>
      `,
      text: `
App Message from User

User ID: ${user_id}
User Email: ${user.email}
Reply Email: ${email}
Date: ${new Date().toLocaleString()}

Message:
${message}

---
This message was sent from the HealthConsultant mobile app.
You can reply directly to this email to respond to the user.
      `,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('📧 Email sent successfully:', info.messageId);

    return NextResponse.json({ 
      success: true,
      message: 'Email sent successfully!',
      messageId: info.messageId,
      user_id: user_id,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:8081',
        'Access-Control-Allow-Credentials': 'true',
      }
    });

  } catch (error) {
    console.error("Mobile email API error:", error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('authentication')) {
        return NextResponse.json({ 
          error: 'Email authentication failed. Please check SMTP credentials.',
          success: false 
        }, { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': getAllowedOrigin(request),
            'Access-Control-Allow-Credentials': 'true',
          }
        });
      } else if (error.message.includes('connection')) {
        return NextResponse.json({ 
          error: 'Unable to connect to email server.',
          success: false 
        }, { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': getAllowedOrigin(request),
            'Access-Control-Allow-Credentials': 'true',
          }
        });
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to send email. Please try again later.',
      success: false 
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:8081',
        'Access-Control-Allow-Credentials': 'true',
      }
    });
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': getAllowedOrigin(request),
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}
