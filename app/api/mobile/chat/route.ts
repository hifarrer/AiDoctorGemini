import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { VertexAI } from '@google-cloud/vertexai';
import { recordUserInteraction, canUserInteract } from '@/lib/server/user-interactions';
import { findUserById } from '@/lib/server/users';
import { getPlans } from '@/lib/server/plans';

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

export async function POST(request: NextRequest) {
  try {
    // Parse multipart/form-data
    const formData = await request.formData();
    
    // Extract parameters
    const userId = formData.get('user_id') as string;
    const prompt = formData.get('prompt') as string;
    const image = formData.get('image') as File | null;
    const pdf = formData.get('pdf') as File | null;
    const pdfText = formData.get('pdf_text') as string | null;

    // Validate required parameters
    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': getAllowedOrigin(request),
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }

    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': getAllowedOrigin(request),
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }

    // Validate that user exists in database and get full user data
    const user = await findUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { 
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': getAllowedOrigin(request),
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }

    // Get user's plan information
    const plans = await getPlans();
    const userPlan = plans.find(plan => plan.title === user.plan) || plans.find(plan => plan.title === 'Free');
    
    if (!userPlan) {
      return NextResponse.json({ error: 'User plan not found' }, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': getAllowedOrigin(request),
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }

    console.log(`🤖 Mobile chat request from user ${userId}: ${prompt.substring(0, 100)}...`);

    // Determine interaction type based on content
    const interactionType: 'chat' | 'image_analysis' | 'health_report' = image
      ? 'image_analysis'
      : (pdf || pdfText)
      ? 'health_report'
      : 'chat';

    // Check if user can interact based on plan limits
    try {
      const canInteract = await canUserInteract(user.id, userPlan.id);
      if (!canInteract.canInteract) {
        return NextResponse.json({
          error: 'Interaction limit reached',
          message: 'You have reached your monthly interaction limit. Please upgrade your plan.',
          remaining: canInteract.remainingInteractions ?? 0,
          limit: canInteract.limit ?? null,
        }, { 
          status: 429,
          headers: {
            'Access-Control-Allow-Origin': getAllowedOrigin(request),
            'Access-Control-Allow-Credentials': 'true',
          }
        });
      }

      // Record the interaction immediately after passing the limit check
      try {
        await recordUserInteraction(user.id, userPlan.id, interactionType);
        console.log(`✅ User interaction recorded: ${interactionType} for user ${user.email}`);
      } catch (recErr) {
        console.error('Failed to record user interaction:', recErr);
        // Don't block the request if recording fails
      }
    } catch (error) {
      console.error('Failed to enforce interaction limit:', error);
      // On enforcement error, do not block the user; continue
    }

    // Validate environment variables
    const projectId = process.env.GOOGLE_VERTEX_PROJECT;
    const location = process.env.GOOGLE_VERTEX_LOCATION || 'us-central1';
    const credentialsBase64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;

    if (!projectId) {
      console.error('GOOGLE_VERTEX_PROJECT environment variable is not set');
      return NextResponse.json({ error: 'AI service configuration error' }, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': getAllowedOrigin(request),
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }

    if (!credentialsBase64) {
      console.error('GOOGLE_APPLICATION_CREDENTIALS_BASE64 environment variable is not set');
      return NextResponse.json({ error: 'AI service credentials not configured' }, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': getAllowedOrigin(request),
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }

    // Parse credentials
    let parsedCredentials;
    try {
      const credentialsJson = Buffer.from(credentialsBase64, 'base64').toString('utf-8');
      parsedCredentials = JSON.parse(credentialsJson);
    } catch (e: any) {
      console.error('Failed to decode/parse credentials from Base64:', e.message);
      return NextResponse.json({ error: 'Invalid server credentials format.' }, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': getAllowedOrigin(request),
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }

    // Initialize VertexAI with explicit credentials
    const vertexAI = new VertexAI({
      project: projectId,
      location: location,
      googleAuthOptions: {
        credentials: {
          client_email: parsedCredentials.client_email,
          private_key: parsedCredentials.private_key,
        },
      },
    });

    const model = vertexAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
    });

    // Prepare content for AI
    const content: any[] = [
      {
        text: prompt
      }
    ];

    // Handle image if provided
    if (image && image.size > 0) {
      // Validate image file
      if (!image.type.startsWith('image/')) {
        return NextResponse.json({ error: 'Invalid image file type' }, { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': getAllowedOrigin(request),
            'Access-Control-Allow-Credentials': 'true',
          }
        });
      }

      // Validate image size (max 10MB)
      if (image.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Image file too large (max 10MB)' }, { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': getAllowedOrigin(request),
            'Access-Control-Allow-Credentials': 'true',
          }
        });
      }

      const imageBuffer = await image.arrayBuffer();
      const imageBase64 = Buffer.from(imageBuffer).toString('base64');
      
      content.push({
        inline_data: {
          mime_type: image.type,
          data: imageBase64
        }
      });

      console.log(`📷 Image attached: ${image.name} (${image.size} bytes)`);
    }

    // Handle PDF if provided
    if (pdf && pdf.size > 0) {
      // Validate PDF file
      if (pdf.type !== 'application/pdf') {
        return NextResponse.json({ error: 'Invalid PDF file type' }, { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': getAllowedOrigin(request),
            'Access-Control-Allow-Credentials': 'true',
          }
        });
      }

      // Validate PDF size (max 10MB)
      if (pdf.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'PDF file too large (max 10MB)' }, { 
          status: 400,
          headers: {
            'Access-Control-Allow-Origin': getAllowedOrigin(request),
            'Access-Control-Allow-Credentials': 'true',
          }
        });
      }

      console.log(`📄 Starting server-side PDF extraction: ${pdf.name} (${(pdf.size / 1024).toFixed(2)} KB)`);
      
      try {
        // Convert PDF file to buffer - same as dashboard
        const arrayBuffer = await pdf.arrayBuffer();
        const typedarray = new Uint8Array(arrayBuffer);
        
        console.log(`📄 Attempting PDF text extraction using pdfjs-dist (server-side, legacy build, no worker)...`);

        // Use legacy build that works better in Node and disable worker
        const pdfjsLib: any = await import('pdfjs-dist/legacy/build/pdf.js');
        
        const pdfDoc = await pdfjsLib.getDocument({ data: typedarray, disableWorker: true }).promise;
        let fullText = "";
        
        console.log(`📄 PDF loaded: ${pdfDoc.numPages} pages`);
        
        // Extract text from each page - EXACT same logic as dashboard
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(" ");
          fullText += pageText + "\n";
        }
        
        const extractedText = fullText.trim();
        
        if (extractedText && extractedText.length > 10) {
          content.push({
            text: `\n\nHere is the content from the PDF file "${pdf.name}" (${pdfDoc.numPages} pages):\n\n${extractedText}`
          });
          
          console.log(`📄 PDF text extracted successfully: ${pdf.name} (${pdfDoc.numPages} pages, ${extractedText.length} characters)`);
          console.log(`📄 First 200 chars: ${extractedText.substring(0, 200)}...`);
        } else {
          content.push({
            text: `\n\nI received a PDF file named "${pdf.name}" (${(pdf.size / 1024).toFixed(2)} KB, ${pdfDoc.numPages} pages) but was unable to extract readable text content. This might be a scanned document or image-based PDF.`
          });
          console.log(`📄 PDF processed but no text extracted: ${pdf.name} (${pdfDoc.numPages} pages)`);
        }
      } catch (pdfError: any) {
        console.error('Error extracting PDF text:', pdfError);

        // Fallback: include the PDF as an inline attachment hint for the AI
        try {
          const base64 = Buffer.from(await pdf.arrayBuffer()).toString('base64');
          content.push({
            text: `\n\n[Attachment: PDF base64 inline; filename="${pdf.name}", size=${(pdf.size / 1024).toFixed(2)} KB]`
          });
          content.push({
            inline_data: {
              mime_type: 'application/pdf',
              data: base64
            }
          } as any);
        } catch (e) {
          content.push({
            text: `\n\nI received a PDF file named "${pdf.name}" (${(pdf.size / 1024).toFixed(2)} KB) but encountered an error while extracting the text content. Please ensure the PDF contains readable text and try again.`
          });
        }
      }
    }

    // Handle pre-extracted PDF text if provided (fallback option)
    if (pdfText && pdfText.trim().length > 0) {
      const cleanedPdfText = pdfText.trim();
      content.push({
        text: `\n\nHere is the PDF content provided:\n\n${cleanedPdfText}`
      });
      console.log(`📄 Pre-extracted PDF text received: ${cleanedPdfText.length} characters`);
      console.log(`📄 First 200 chars: ${cleanedPdfText.substring(0, 200)}...`);
    }

    // Debug: Log the content being sent to AI
    console.log(`📤 Content being sent to AI:`, JSON.stringify(content, null, 2));

    // Generate AI response
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `You are a helpful AI assistant providing general health information for educational purposes only. When users ask health-related questions or provide health information, respond with caution and emphasize consulting healthcare professionals.

CRITICAL COMPLIANCE RULES - YOU MUST FOLLOW THESE:

1. NEVER make diagnostic statements. Instead of "Your symptoms indicate X condition," say "These symptoms can sometimes be associated with X condition. Consult a healthcare professional for evaluation."

2. NEVER provide specific medication recommendations. Instead of "AI recommends taking ibuprofen," say "You may discuss common over-the-counter pain relief options with a doctor."

3. NEVER claim to diagnose. Instead of "This app diagnoses your condition," say "This app provides general health information for educational purposes."

4. ALWAYS use cautious, non-definitive language:
   - Use "may be associated with" instead of "indicates"
   - Use "might be worth discussing with a doctor" instead of "you should"
   - Use "can sometimes" instead of "always" or definitive statements
   - Use "general information" and "educational purposes" language

5. When providing health information, frame it as general knowledge that requires professional consultation.

6. When analyzing PDFs or health reports, provide informational context but always emphasize that interpretation requires professional medical evaluation.

7. Include relevant medical citations when providing health information:
   - Site Name: [Name of medical website/institution]
   - URL: [Direct link to the source]
   
   Use reputable medical sources such as Mayo Clinic, WebMD, CDC, NIH, medical journals, or other established healthcare institutions.

Remember: You are providing educational information only, not medical advice, diagnosis, or treatment recommendations.`
            }
          ]
        },
        { role: 'user', parts: content }
      ],
    });

    let aiResponse = result.response.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

    // Append compliance disclaimer to every response for mobile app compliance
    const complianceDisclaimer = `\n\n---\n\n**Important:** Health Consultant AI is intended for general informational and educational purposes only. It does not provide medical advice, diagnosis, or treatment. Always consult a licensed healthcare provider before making decisions related to your health or treatment.`;
    
    aiResponse = aiResponse + complianceDisclaimer;

    console.log(`✅ AI response generated: ${aiResponse.length} characters`);

    // Record usage for analytics
    try {
      const supabase = getSupabaseServerClient();
      const { error: usageError } = await supabase
        .from('usage_records')
        .insert({
          user_id: userId,
          user_email: user.email,
          date: new Date().toISOString(),
          interaction_type: image ? 'image_chat' : pdf ? 'document_chat' : 'text_chat',
          tokens_used: Math.ceil((prompt.length + aiResponse.length) / 4), // Rough token estimate
          created_at: new Date().toISOString()
        });

      if (usageError) {
        console.error('Error recording usage:', usageError);
      }
    } catch (usageError) {
      console.error('Error recording usage:', usageError);
    }

    // Return AI response
    return NextResponse.json({
      success: true,
      response: aiResponse,
      user_id: userId,
      timestamp: new Date().toISOString(),
      attachments: {
        image: image ? {
          name: image.name,
          size: image.size,
          type: image.type
        } : null,
        pdf: pdf ? {
          name: pdf.name,
          size: pdf.size,
          type: pdf.type
        } : null
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': 'http://localhost:8081',
        'Access-Control-Allow-Credentials': 'true',
      }
    });

  } catch (error) {
    console.error('Error in mobile chat API:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process chat request',
      details: error instanceof Error ? error.message : 'Unknown error'
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
