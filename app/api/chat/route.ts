import { streamText } from 'ai';
import { createVertex } from '@ai-sdk/google-vertex';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  console.log('API route /api/chat handler started.');

  try {
    const { messages } = await req.json();

    console.log('Checking for required environment variables...');
    // The AI SDK will automatically use GOOGLE_VERTEX_PROJECT, GOOGLE_VERTEX_LOCATION,
    // and GOOGLE_APPLICATION_CREDENTIALS_JSON from process.env
    const projectId = process.env.GOOGLE_VERTEX_PROJECT;
    const location = process.env.GOOGLE_VERTEX_LOCATION;
    const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    if (!projectId || !location || !credentials) {
      console.error('Missing one or more required Google Cloud environment variables.');
      // Log which ones are missing for easier debugging on Vercel
      if (!projectId) console.error('-> GOOGLE_VERTEX_PROJECT is not set.');
      if (!location) console.error('-> GOOGLE_VERTEX_LOCATION is not set.');
      if (!credentials) console.error('-> GOOGLE_APPLICATION_CREDENTIALS_JSON is not set.');
      
      return NextResponse.json(
        { error: 'Server configuration error. See server logs for details.' },
        { status: 500 },
      );
    }
    console.log('All required environment variables seem to be present.');

    console.log('Initializing Vertex AI client via createVertex()...');
    // By leaving createVertex() empty, the Vercel AI SDK automatically uses the env vars.
    const vertex = createVertex();
    console.log('Vertex AI client initialized implicitly.');
    
    console.log('Calling streamText with the model...');
    const result = await streamText({
      model: vertex('gemini-1.5-flash-001'),
      messages,
    });
    console.log('Successfully received response from streamText.');

    return result.toDataStreamResponse();

  } catch (error: any) {
    console.error('!!! An error occurred in the chat API route !!!');
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);

    // Some errors have a 'cause' property with more details
    if (error.cause) {
        // The cause can be a complex object, stringify it for better logging
        console.error('Error Cause:', JSON.stringify(error.cause, null, 2));
    } else {
        console.error('Error Cause: Not available.');
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