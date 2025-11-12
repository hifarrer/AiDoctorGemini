import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

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
        }, { status: 500 });
      }
      return NextResponse.json({ error: 'Failed to fetch chat conversations', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ conversations: conversations || [] });
  } catch (error) {
    console.error('Error in chat conversations GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { messages, title, conversationId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

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

    let conversation;
    let error;

    // If conversationId is provided, try to update existing conversation
    if (conversationId) {
      // Verify the conversation belongs to the user
      const { data: existingConv } = await supabase
        .from('chat_conversations')
        .select('id, user_id')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (existingConv) {
        // Update existing conversation
        const { data: updatedConv, error: updateError } = await supabase
          .from('chat_conversations')
          .update({
            title: conversationTitle,
            messages: messages,
            updated_at: new Date().toISOString()
          })
          .eq('id', conversationId)
          .eq('user_id', user.id)
          .select()
          .single();

        conversation = updatedConv;
        error = updateError;
      } else {
        // Conversation doesn't exist or doesn't belong to user, create new one
        const { data: newConv, error: insertError } = await supabase
          .from('chat_conversations')
          .insert({
            user_id: user.id,
            title: conversationTitle,
            messages: messages
          })
          .select()
          .single();

        conversation = newConv;
        error = insertError;
      }
    } else {
      // Create new conversation
      const { data: newConv, error: insertError } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user.id,
          title: conversationTitle,
          messages: messages
        })
        .select()
        .single();

      conversation = newConv;
      error = insertError;
    }

    if (error) {
      console.error('Error saving chat conversation:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      // Check if table doesn't exist
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'Chat conversations table does not exist. Please run the database migration.',
          details: error.message 
        }, { status: 500 });
      }
      return NextResponse.json({ error: 'Failed to save chat conversation', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Error in chat conversations POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

