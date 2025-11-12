import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { findUserById } from '@/lib/server/users';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// CORS configuration for Expo development
const getAllowedOrigin = (request: NextRequest): string => {
  const origin = request.headers.get('origin');
  
  console.log('🔍 CORS Debug - Request origin:', origin);
  console.log('🔍 CORS Debug - Request method:', request.method);
  console.log('🔍 CORS Debug - Request URL:', request.url);
  
  // Check if origin matches any allowed pattern
  if (origin) {
    // Check for localhost (various ports)
    if (origin?.includes('localhost')) {
      console.log('✅ CORS - Allowing localhost origin:', origin);
      return origin;
    }
    
    // Check for Expo tunnel URLs
    if (origin?.includes('.exp.direct')) {
      console.log('✅ CORS - Allowing Expo tunnel origin:', origin);
      return origin;
    }
    
    // Check for Expo Go app
    if (origin?.includes('exp://')) {
      console.log('✅ CORS - Allowing Expo Go origin:', origin);
      return origin;
    }
  }
  
  // Default fallback - allow localhost for development
  console.log('⚠️ CORS - Using fallback origin for:', origin);
  return origin || 'http://localhost:8081';
};

export async function GET(request: NextRequest) {
  // Handle OPTIONS preflight if it reaches here
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': getAllowedOrigin(request),
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

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

    // Validate that user exists in database
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

    const supabase = getSupabaseServerClient();
    const { data: conversations, error } = await supabase
      .from('chat_conversations')
      .select('id, title, messages, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching chat conversations:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Chat conversations table does not exist. Please run the database migration.',
          details: error.message 
        }, { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': getAllowedOrigin(request),
            'Access-Control-Allow-Credentials': 'true',
          }
        });
      }
      return NextResponse.json({ 
        error: 'Failed to fetch chat conversations', 
        details: error.message 
      }, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': getAllowedOrigin(request),
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }

    return NextResponse.json({
      success: true,
      conversations: conversations || [],
      user_id: userId,
      count: conversations?.length || 0
    }, {
      headers: {
        'Access-Control-Allow-Origin': getAllowedOrigin(request),
        'Access-Control-Allow-Credentials': 'true',
      }
    });
  } catch (error) {
    console.error('Error in mobile chat conversations GET:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': getAllowedOrigin(request),
        'Access-Control-Allow-Credentials': 'true',
      }
    });
  }
}

export async function POST(request: NextRequest) {
  // Handle OPTIONS preflight if it reaches here
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': getAllowedOrigin(request),
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  try {
    const body = await request.json();
    const { user_id, messages, title } = body;

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

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array is required' }, { 
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

    const supabase = getSupabaseServerClient();

    // Generate title from first user message if not provided
    let conversationTitle = title;
    if (!conversationTitle) {
      const firstUserMessage = messages.find((msg: any) => msg.role === 'user');
      if (firstUserMessage?.content) {
        const content = typeof firstUserMessage.content === 'string' 
          ? firstUserMessage.content 
          : JSON.stringify(firstUserMessage.content);
        conversationTitle = content.substring(0, 100).trim();
        if (conversationTitle.length === 100) {
          conversationTitle += '...';
        }
      } else {
        conversationTitle = `Chat - ${new Date().toLocaleDateString()}`;
      }
    }

    const { data: conversation, error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: user.id,
        title: conversationTitle,
        messages: messages
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating chat conversation:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Chat conversations table does not exist. Please run the database migration.',
          details: error.message 
        }, { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': getAllowedOrigin(request),
            'Access-Control-Allow-Credentials': 'true',
          }
        });
      }
      return NextResponse.json({ 
        error: 'Failed to create chat conversation', 
        details: error.message 
      }, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': getAllowedOrigin(request),
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }

    return NextResponse.json({
      success: true,
      conversation,
      user_id: user_id
    }, {
      headers: {
        'Access-Control-Allow-Origin': getAllowedOrigin(request),
        'Access-Control-Allow-Credentials': 'true',
      }
    });
  } catch (error) {
    console.error('Error in mobile chat conversations POST:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { 
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': getAllowedOrigin(request),
        'Access-Control-Allow-Credentials': 'true',
      }
    });
  }
}

// Handle OPTIONS request for CORS (preflight)
export async function OPTIONS(request: NextRequest) {
  console.log('🔍 OPTIONS request received for:', request.url);
  const origin = getAllowedOrigin(request);
  console.log('✅ OPTIONS - Allowing origin:', origin);
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}


