import { streamText } from "ai";
import { createVertex } from "@ai-sdk/google-vertex";
import { NextRequest, NextResponse } from "next/server";

// Remove the edge runtime configuration to use the default Node.js runtime
// export const runtime = 'edge';

export async function POST(req: NextRequest) {
  console.log("--- API ROUTE V5 (deep logging) ---");
  try {
    console.log("Step 1: Initializing Vertex client...");
    const vertex = createVertex();
    console.log("Step 2: Vertex client initialized. Parsing request body...");

    const body = await req.json();
    console.log("Step 3: Request body parsed. Destructuring body...");
    const { messages, image, document } = body;
    console.log("Step 4: Body destructured. Proceeding with logic...");

    if (!messages) {
      return new NextResponse("Messages are required", { status: 400 });
    }
    
    const systemInstruction = "You are an AI assistant for a medical chat application called AI Doctor. Your user is interacting with you through a web interface that already includes a prominent disclaimer about your limitations and the fact that you are not a medical professional. Therefore, you MUST NOT include any additional disclaimers, warnings, or advice to 'consult a medical professional' in your responses. Focus solely on providing the requested information in a concise and helpful manner.";

    // The last message is the user's prompt
    const userMessage = messages[messages.length - 1];

    // Build the multimodal content array for the Vercel AI SDK
    const content: Array<{ type: 'text'; text: string } | { type: 'image'; image: URL | string | Buffer }> = [];

    // Only add the text part if there is content
    if (userMessage.content && userMessage.content.trim() !== "") {
      content.push({ type: 'text', text: userMessage.content });
    }

    // Use the top-level image from the request body
    if (image) {
      content.push({ type: 'image', image: image as string });
    }

    // Add the document content if it exists
    if (document) {
      const documentHeaderText = `\n\n--- Start of Uploaded PDF ---\n\n${document}\n\n--- End of Uploaded PDF ---\n\n`;
      content.push({ type: 'text', text: documentHeaderText });
    }

    const result = await streamText({
      model: vertex("gemini-2.5-pro"),
      system: systemInstruction,
      messages: [
          ...messages.slice(0, -1),
          // Pass a clean user message with the correctly formatted multimodal content
          { role: 'user', content }
      ],
    });

    return result.toDataStreamResponse();

  } catch (error: any) {
    const errorMessage = error.message || "An unknown error occurred";
    const errorCause = error.cause ? JSON.stringify(error.cause) : "No cause available";

    console.error("[CHAT_ERROR] Detailed Error:", {
      message: errorMessage,
      cause: errorCause,
      stack: error.stack,
      fullError: JSON.stringify(error, null, 2)
    });
    
    // Return a more structured JSON error response
    return NextResponse.json(
      { 
        error: "An internal server error occurred.",
        details: errorMessage,
        cause: errorCause,
      }, 
      { status: 500 }
    );
  }
} 