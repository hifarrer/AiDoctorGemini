import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { findUserById } from '@/lib/server/users';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// CORS configuration for Expo development
const getAllowedOrigin = (request: NextRequest): string => {
  const origin = request.headers.get('origin');
  
  console.log('🔍 CORS Debug [DELETE] - Request origin:', origin);
  
  // Check if origin matches any allowed pattern
  if (origin) {
    // Check for localhost (various ports)
    if (origin?.includes('localhost')) {
      console.log('✅ CORS [DELETE] - Allowing localhost origin:', origin);
      return origin;
    }
    
    // Check for Expo tunnel URLs
    if (origin?.includes('.exp.direct')) {
      console.log('✅ CORS [DELETE] - Allowing Expo tunnel origin:', origin);
      return origin;
    }
    
    // Check for Expo Go app
    if (origin?.includes('exp://')) {
      console.log('✅ CORS [DELETE] - Allowing Expo Go origin:', origin);
      return origin;
    }
  }
  
  // Default fallback
  console.log('⚠️ CORS [DELETE] - Using fallback origin for:', origin);
  return origin || 'http://localhost:8081';
};

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Handle OPTIONS preflight if it reaches here
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': getAllowedOrigin(request),
        'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
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

    // Verify the conversation belongs to the user
    const { data: conversation, error: fetchError } = await supabase
      .from('chat_conversations')
      .select('id, user_id')
      .eq('id', params.id)
      .single();

    if (fetchError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { 
        status: 404,
        headers: {
          'Access-Control-Allow-Origin': getAllowedOrigin(request),
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }

    if (conversation.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { 
        status: 403,
        headers: {
          'Access-Control-Allow-Origin': getAllowedOrigin(request),
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }

    const { error: deleteError } = await supabase
      .from('chat_conversations')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting chat conversation:', deleteError);
      return NextResponse.json({ error: 'Failed to delete conversation' }, { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': getAllowedOrigin(request),
          'Access-Control-Allow-Credentials': 'true',
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully'
    }, {
      headers: {
        'Access-Control-Allow-Origin': getAllowedOrigin(request),
        'Access-Control-Allow-Credentials': 'true',
      }
    });
  } catch (error) {
    console.error('Error in mobile chat conversation DELETE:', error);
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
  console.log('🔍 OPTIONS request received for DELETE route:', request.url);
  const origin = getAllowedOrigin(request);
  console.log('✅ OPTIONS [DELETE] - Allowing origin:', origin);
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400', // 24 hours
    },
  });
}


