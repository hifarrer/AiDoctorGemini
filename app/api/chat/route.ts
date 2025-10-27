import { VertexAI } from '@google-cloud/vertexai';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { recordInteraction } from '@/lib/server/usage';
import { NextRequest } from 'next/server';
import { recordUserInteraction, canUserInteract, getUserInteractionStats } from '@/lib/server/user-interactions';
import { findUserByEmail } from '@/lib/server/users';
import { getPlans } from '@/lib/server/plans';
import { getSupabaseServerClient } from '@/lib/supabase/server';

// Define the session type based on our auth configuration
interface SessionUser {
  id: string;
  email: string;
  firstName?: string;
  isAdmin: boolean;
}

interface Session {
  user: SessionUser;
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper to convert Google's complex stream into the AI SDK's Data Stream format
async function* streamTransformer(googleStream: AsyncGenerator<any>) {
  for await (const chunk of googleStream) {
    if (chunk?.candidates?.[0]?.content?.parts?.[0]?.text) {
      const text = chunk.candidates[0].content.parts[0].text;
      // Manually format the chunk according to the AI SDK Data Stream protocol.
      // 0: is for text chunks.
      yield `0:${JSON.stringify(text)}\n`;
    }
  }
}

// Helper to convert our simple string iterator into a ReadableStream that the AI SDK can understand
function iteratorToReadableStream(iterator: AsyncGenerator<string>) {
  return new ReadableStream({
    async pull(controller) {
      try {
        const { value, done } = await iterator.next();
        if (done) {
          controller.close();
        } else {
          controller.enqueue(new TextEncoder().encode(value));
        }
      } catch (e) {
        console.error('Error within the readable stream pull function:', e);
        controller.error(e); // Propagate the error to the stream consumer
      }
    },
  });
}

// Helper function to save image analysis results
async function saveImageAnalysis(
  userId: string, 
  imageData: string, 
  imageMimeType: string, 
  imageFilename: string, 
  aiResponse: string
) {
  try {
    const supabase = getSupabaseServerClient();
    
    // Create a health report entry for the image analysis
    const { data: healthReport, error } = await supabase
      .from('health_reports')
      .insert({
        user_id: userId,
        title: `Image Analysis - ${imageFilename}`,
        report_type: 'image_analysis',
        original_filename: imageFilename,
        file_content: aiResponse, // Store the full AI analysis
        file_size: Math.round(imageData.length * 0.75), // Approximate size
        mime_type: imageMimeType,
        ai_analysis: aiResponse,
        ai_summary: aiResponse.substring(0, 500) + (aiResponse.length > 500 ? '...' : ''), // Truncated summary
        key_findings: [], // Could be extracted from AI response in the future
        recommendations: [], // Could be extracted from AI response in the future
        risk_level: 'normal', // Default risk level
        image_data: imageData, // Store the base64 image data
        image_filename: imageFilename,
        image_mime_type: imageMimeType,
        analysis_type: 'image'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving image analysis:', error);
      return null;
    }

    // Add history entry
    await supabase
      .from('health_report_history')
      .insert({
        health_report_id: healthReport.id,
        user_id: userId,
        action: 'image_analyzed',
        details: { title: healthReport.title, image_filename: imageFilename }
      });

    console.log('✅ Image analysis saved successfully:', healthReport.id);
    return healthReport;
  } catch (error) {
    console.error('Error in saveImageAnalysis:', error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  // Simple test to see if our route is being called
  console.log('=== CHAT API ROUTE CALLED ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  
  // Also log to a file or use a different method to ensure we see it
  console.error('CHAT ROUTE CALLED - THIS SHOULD BE VISIBLE');
  
  try {
    const { messages, image, document, healthReport } = await req.json();
    const userMessage = messages[messages.length - 1];
    const session = await getServerSession(authOptions as any) as Session | null;

    console.log('Chat request received:', {
      hasMessages: !!messages,
      messageCount: messages?.length,
      hasImage: !!image,
      hasDocument: !!document,
      hasHealthReport: !!healthReport,
      userEmail: (session as any)?.user?.email || 'anonymous'
    });

    // Enforce plan interaction limits for authenticated users
    if ((session as any)?.user?.email) {
      try {
        const user = await findUserByEmail((session as any).user.email);
        if (user) {
          const plans = await getPlans();
          const userPlan = plans.find(plan => plan.title === user.plan) || plans.find(plan => plan.title === 'Free');
          if (userPlan) {
            const interactionType: 'chat' | 'image_analysis' | 'health_report' = image
              ? 'image_analysis'
              : (document || healthReport)
              ? 'health_report'
              : 'chat';

            const can = await canUserInteract(user.id, userPlan.id);
            if (!can.canInteract) {
              return NextResponse.json({
                error: 'Interaction limit reached',
                message: 'You have reached your monthly interaction limit. Please upgrade your plan.',
                remaining: can.remainingInteractions ?? 0,
                limit: can.limit ?? null,
              }, { status: 429 });
            }

            // Record the interaction immediately after passing the limit check so stats reflect promptly
            try {
              await recordUserInteraction(user.id, userPlan.id, interactionType);
              console.log(`✅ User interaction recorded (pre-check pass): ${interactionType} for user ${user.email}`);
            } catch (recErr) {
              console.error('Failed to record user interaction after limit check:', recErr);
            }
          }
        }
      } catch (error) {
        console.error('Failed to enforce interaction limit:', error);
        // On enforcement error, do not block the user; continue
      }
    }

    // Record usage aggregate (analytics) for both authenticated and non-authenticated users
    // Note: This does not enforce limits; user_interactions above is authoritative for limits
    try {
      let prompts = 1; // Base interaction
      if (image) prompts += 1; // Image analysis
      if (document) prompts += 1; // Document analysis
      if (healthReport) prompts += 1; // Health report analysis
      const userIdentifier = (session as any)?.user?.email || 'anonymous';
      console.log(`Recording usage aggregate for ${userIdentifier}: ${prompts} prompts`);
      await recordInteraction(userIdentifier, userIdentifier, prompts);
    } catch (error) {
      console.error('Failed to record usage aggregate:', error);
    }

    if (!userMessage?.content && !image && !document && !healthReport) {
      return NextResponse.json({ error: 'No message content, image, document, or health report found.' }, { status: 400 });
    }

    // Build the parts array for the multi-modal request
    const contentParts: any[] = [];
    
    // Combine user message content with document content if present
    let textContent = '';
    if (userMessage.content) {
        textContent = userMessage.content;
    }
    
    if (document) {
        console.log('Document content detected, adding to request.');
        if (textContent) {
            textContent += '\n\nDocument content:\n' + document;
        } else {
            textContent = 'Document content:\n' + document;
        }
    }
    
    if (healthReport) {
        console.log('Health report detected, adding context to request.');
        const healthContext = `
Health Report Context:
- Title: ${healthReport.title}
- Type: ${healthReport.reportType}
- Risk Level: ${healthReport.riskLevel}
- Summary: ${healthReport.summary}
- Key Findings: ${healthReport.keyFindings?.join(', ') || 'None'}
- Recommendations: ${healthReport.recommendations?.join(', ') || 'None'}

The user is asking questions about this health report. Please provide helpful, accurate medical information based on the report analysis. Always remind the user to consult with their healthcare provider for medical decisions.
        `;
        
        if (textContent) {
            textContent += '\n\n' + healthContext;
        } else {
            textContent = healthContext;
        }
    }
    
    if (textContent) {
        contentParts.push({ text: textContent });
    }

    if (image) {
        console.log('Image data URL detected, processing for multi-modal request.');
        // The image is a data URL, e.g., "data:image/png;base64,iVBORw0KGgo..."
        // We need to extract the mime type and the base64 data part.
        const match = image.match(/^data:(.*);base64,(.*)$/);
        if (!match) {
            console.error('Invalid image data URL format.');
            return NextResponse.json({ error: 'Invalid image format.' }, { status: 400 });
        }
        const mimeType = match[1];
        const base64Data = match[2];

        contentParts.push({
            inlineData: {
                mimeType,
                data: base64Data,
            },
        });
    }

    console.log('Checking for required environment variables...');
    const projectId = process.env.GOOGLE_VERTEX_PROJECT;
    const location = process.env.GOOGLE_VERTEX_LOCATION;
    const credentialsBase64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;

    if (!projectId || !location || !credentialsBase64) {
      const missingVars = [
        !projectId && 'GOOGLE_VERTEX_PROJECT',
        !location && 'GOOGLE_VERTEX_LOCATION',
        !credentialsBase64 && 'GOOGLE_APPLICATION_CREDENTIALS_BASE64',
      ].filter(Boolean).join(', ');
      console.error(`Missing environment variables: ${missingVars}`);
      return NextResponse.json({ error: `Server configuration error: Missing ${missingVars}` }, { status: 500 });
    }
    console.log('All required environment variables seem to be present.');

    let parsedCredentials;
    try {
      console.log('Decoding and parsing Base64 credentials...');
      const decoded = Buffer.from(credentialsBase64, 'base64').toString('utf-8');
      parsedCredentials = JSON.parse(decoded);
      console.log('Successfully parsed credentials.');
    } catch (e: any) {
      console.error('Failed to decode/parse credentials from Base64:', e.message);
      return NextResponse.json({ error: 'Invalid server credentials format.' }, { status: 500 });
    }

    console.log('Initializing official Google VertexAI client explicitly...');
    const vertex_ai = new VertexAI({
      project: projectId,
      location: location,
      googleAuthOptions: {
        credentials: {
          client_email: parsedCredentials.client_email,
          private_key: parsedCredentials.private_key,
        },
      },
    });
    console.log('VertexAI client initialized successfully.');

    const generativeModel = vertex_ai.getGenerativeModel({
      model: 'gemini-2.5-pro',
    });

    console.log('Calling the generative model to stream content...');
    // Construct the full multi-modal request with system instruction
    const request = {
        contents: [{ role: 'user', parts: contentParts }],
        systemInstruction: {
            role: 'system',
            parts: [{ 
                text: "You are a medical AI assistant. Provide helpful, accurate medical information in a clear, well-formatted manner using markdown. Use headers (###), bullet points (*), numbered lists, and proper spacing to make information easy to read. The website already has appropriate disclaimers and legal notices, so do not include disclaimers about not being a doctor or seeking professional medical advice in your responses. Focus on providing direct, helpful medical information.\n\nIMPORTANT: When providing medical advice, recommendations, or health information, ALWAYS include relevant medical citations with the following format:\n- Site Name: [Name of medical website/institution]\n- URL: [Direct link to the source]\n\nInclude citations for any medical facts, treatment recommendations, drug information, or health guidelines you provide. Use reputable medical sources such as Mayo Clinic, WebMD, CDC, NIH, medical journals, or other established healthcare institutions." 
            }]
        }
    };
    const googleStreamResult = await generativeModel.generateContentStream(request);
    console.log('Successfully received stream from Google model.');

    // If this is an image analysis, we need to collect the full response to save it
    if (image && session?.user?.email) {
      try {
        // Get the user ID for saving the analysis
        const user = await findUserByEmail(session.user.email);
        if (user) {
          // Collect the full response
          let fullResponse = '';
          for await (const chunk of googleStreamResult.stream) {
            if (chunk?.candidates?.[0]?.content?.parts?.[0]?.text) {
              fullResponse += chunk.candidates[0].content.parts[0].text;
            }
          }
          
          // Save the image analysis
          const imageMatch = image.match(/^data:(.*);base64,(.*)$/);
          if (imageMatch) {
            const imageMimeType = imageMatch[1];
            const imageData = imageMatch[2];
            const imageFilename = `image_${Date.now()}.${imageMimeType.split('/')[1] || 'jpg'}`;
            
            await saveImageAnalysis(user.id, imageData, imageMimeType, imageFilename, fullResponse);
          }
          
          // Create a new stream from the collected response
          const responseChunks = fullResponse.split(' ').map(word => `0:${JSON.stringify(word + ' ')}\n`);
          const readableStream = new ReadableStream({
            start(controller) {
              for (const chunk of responseChunks) {
                controller.enqueue(new TextEncoder().encode(chunk));
              }
              controller.close();
            }
          });
          
          return new Response(readableStream, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
            },
          });
        }
      } catch (error) {
        console.error('Error saving image analysis:', error);
        // Continue with normal streaming if saving fails
      }
    }

    const transformedIterator = streamTransformer(googleStreamResult.stream);
    const readableStream = iteratorToReadableStream(transformedIterator);

    // Already recorded after limit check; no need to duplicate here

    // Return a standard response with the correctly formatted stream
    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });

  } catch (error: any) {
    console.error('!!! AN UNRECOVERABLE ERROR OCCURRED IN THE CHAT API ROUTE !!!');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    return NextResponse.json({ error: 'An internal server error occurred.', details: error.message }, { status: 500 });
  }
} 