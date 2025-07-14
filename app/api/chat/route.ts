import { VertexAI } from '@google-cloud/vertexai';
import { StreamingTextResponse } from 'ai';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper to convert Google's complex stream into a simple string iterator
async function* streamTransformer(googleStream: AsyncGenerator<any>) {
  for await (const chunk of googleStream) {
    if (chunk?.candidates?.[0]?.content?.parts?.[0]?.text) {
      yield chunk.candidates[0].content.parts[0].text;
    }
  }
}

// Helper to convert our simple string iterator into a ReadableStream
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
      } catch (e: any) {
        console.error('Error in readable stream pull:', e);
        controller.error(e);
      }
    },
  });
}

export async function POST(req: Request) {
  console.log(
    'API route handler started. Using explicit Google client with Base64 credentials.',
  );

  try {
    const { messages } = await req.json();

    console.log('Checking for required environment variables...');
    const projectId = process.env.GOOGLE_VERTEX_PROJECT;
    const location = process.env.GOOGLE_VERTEX_LOCATION;
    const credentialsBase64 =
      process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64; // Using the new Base64 var

    if (!projectId || !location || !credentialsBase64) {
      const missingVars = [
        !projectId && 'GOOGLE_VERTEX_PROJECT',
        !location && 'GOOGLE_VERTEX_LOCATION',
        !credentialsBase64 && 'GOOGLE_APPLICATION_CREDENTIALS_BASE64',
      ]
        .filter(Boolean)
        .join(', ');
      console.error(`Missing environment variables: ${missingVars}`);
      return NextResponse.json(
        { error: `Server configuration error: Missing ${missingVars}` },
        { status: 500 },
      );
    }
    console.log('All required environment variables seem to be present.');

    let parsedCredentials;
    try {
      console.log('Decoding and parsing Base64 credentials...');
      const decoded = Buffer.from(credentialsBase64, 'base64').toString(
        'utf-8',
      );
      parsedCredentials = JSON.parse(decoded);
      console.log('Successfully parsed credentials.');
    } catch (e: any) {
      console.error('Failed to decode/parse credentials from Base64:', e.message);
      return NextResponse.json(
        { error: 'Invalid server credentials format.' },
        { status: 500 },
      );
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
      model: 'gemini-1.5-flash-001',
    });

    console.log('Calling the generative model to stream content...');
    const googleStreamResult = await generativeModel.generateContentStream(
      messages[messages.length - 1].content,
    );
    console.log('Successfully received stream from Google model.');

    const transformedIterator = streamTransformer(googleStreamResult.stream);
    const readableStream = iteratorToReadableStream(transformedIterator);

    return new StreamingTextResponse(readableStream);
    
  } catch (error: any) {
    console.error('!!! AN UNRECOVERABLE ERROR OCCURRED IN THE CHAT API ROUTE !!!');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    if (error.cause) {
      console.error('Error Cause:', JSON.stringify(error.cause, null, 2));
    }
    console.error('Full Error Object:', JSON.stringify(error, null, 2));

    return NextResponse.json(
      {
        error: 'An internal server error occurred.',
        details: error.message,
      },
      { status: 500 },
    );
  }
} 