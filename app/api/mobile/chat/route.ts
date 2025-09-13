import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { VertexAI } from '@google-cloud/vertexai';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse multipart/form-data
    const formData = await request.formData();
    
    // Extract parameters
    const userId = formData.get('user_id') as string;
    const prompt = formData.get('prompt') as string;
    const image = formData.get('image') as File | null;
    const pdf = formData.get('pdf') as File | null;

    // Validate required parameters
    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    // Validate user_id matches session user
    const supabase = getSupabaseServerClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', session.user.email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.id !== userId) {
      return NextResponse.json({ error: 'user_id does not match authenticated user' }, { status: 403 });
    }

    console.log(`🤖 Mobile chat request from user ${userId}: ${prompt.substring(0, 100)}...`);

    // Validate environment variables
    if (!process.env.GOOGLE_VERTEX_PROJECT) {
      console.error('GOOGLE_VERTEX_PROJECT environment variable is not set');
      return NextResponse.json({ error: 'AI service configuration error' }, { status: 500 });
    }

    // Initialize VertexAI
    const vertexAI = new VertexAI({
      project: process.env.GOOGLE_VERTEX_PROJECT!,
      location: process.env.GOOGLE_VERTEX_LOCATION || 'us-central1',
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
        return NextResponse.json({ error: 'Invalid image file type' }, { status: 400 });
      }

      // Validate image size (max 10MB)
      if (image.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Image file too large (max 10MB)' }, { status: 400 });
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
        return NextResponse.json({ error: 'Invalid PDF file type' }, { status: 400 });
      }

      // Validate PDF size (max 10MB)
      if (pdf.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'PDF file too large (max 10MB)' }, { status: 400 });
      }

      // For now, we'll add a note about PDF content
      // In the future, we can implement PDF text extraction here
      content.push({
        text: `\n\n[PDF file attached: ${pdf.name} (${(pdf.size / 1024).toFixed(2)} KB) - Content analysis not yet implemented]`
      });

      console.log(`📄 PDF attached: ${pdf.name} (${pdf.size} bytes)`);
    }

    // Generate AI response
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: content }],
    });

    const aiResponse = result.response.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a response.';

    console.log(`✅ AI response generated: ${aiResponse.length} characters`);

    // Record usage for analytics
    try {
      const { error: usageError } = await supabase
        .from('usage_records')
        .insert({
          user_id: userId,
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
    });

  } catch (error) {
    console.error('Error in mobile chat API:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process chat request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
