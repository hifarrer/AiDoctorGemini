import { streamText } from 'ai';
import { createVertex } from '@ai-sdk/google-vertex';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  console.log(
    'API route /api/chat handler started. Using simple, correct code.',
  );

  try {
    const { messages } = await req.json();

    console.log('Initializing Vertex AI client via createVertex()...');
    const vertex = createVertex();
    console.log('Vertex AI client initialized implicitly.');

    console.log('Calling streamText with the model...');
    const result = await streamText({
      model: vertex('gemini-1.5-flash-001'),
      messages,
    });
    console.log('Successfully received response from streamText. Handing off to Vercel to stream to client.');

    // Per Vercel AI SDK troubleshooting, add keep-alive headers for deployed environments.
    // This can help with streaming issues that only appear on deployment.
    return result.toDataStreamResponse({
      headers: {
        'Connection': 'keep-alive',
        'Transfer-Encoding': 'chunked'
      }
    });

  } catch (error: any) {
    console.error('!!! AN UNRECOVERABLE ERROR OCCURRED IN THE CHAT API ROUTE !!!');
    console.error('This likely means the environment variables are set, but invalid.');
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