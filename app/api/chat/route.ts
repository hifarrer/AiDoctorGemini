import { VertexAI } from '@google-cloud/vertexai';
import { NextResponse } from 'next/server';

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

export async function POST(req: Request) {
  console.log('API route handler started: Using explicit Google client with Base64 credentials.');

  try {
    // The request body now contains messages, and potentially an image data URL and document content
    const { messages, image, document } = await req.json();
    const userMessage = messages[messages.length - 1];

    if (!userMessage?.content && !image && !document) {
      return NextResponse.json({ error: 'No message content, image, or document found.' }, { status: 400 });
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
                text: "You are a medical AI assistant. Provide helpful, accurate medical information. The website already has appropriate disclaimers and legal notices, so do not include disclaimers about not being a doctor or seeking professional medical advice in your responses. Focus on providing direct, helpful medical information." 
            }]
        }
    };
    const googleStreamResult = await generativeModel.generateContentStream(request);
    console.log('Successfully received stream from Google model.');

    const transformedIterator = streamTransformer(googleStreamResult.stream);
    const readableStream = iteratorToReadableStream(transformedIterator);

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
    if (error.cause) {
      console.error('Error Cause:', JSON.stringify(error.cause, null, 2));
    }
    console.error('Full Error Object:', JSON.stringify(error, null, 2));
    return NextResponse.json({ error: 'An internal server error occurred.', details: error.message }, { status: 500 });
  }
} 