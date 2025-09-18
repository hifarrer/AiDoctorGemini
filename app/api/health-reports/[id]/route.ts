import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reportId = params.id;

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
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

    // First, verify the report belongs to the user
    const { data: report, error: fetchError } = await supabase
      .from('health_reports')
      .select('id, title, user_id')
      .eq('id', reportId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !report) {
      return NextResponse.json({ error: 'Report not found or access denied' }, { status: 404 });
    }

    // Delete the report
    const { error: deleteError } = await supabase
      .from('health_reports')
      .delete()
      .eq('id', reportId)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting health report:', deleteError);
      return NextResponse.json({ error: 'Failed to delete health report' }, { status: 500 });
    }

    // Add history entry for deletion
    await supabase
      .from('health_report_history')
      .insert({
        health_report_id: reportId,
        user_id: user.id,
        action: 'deleted',
        details: { title: report.title }
      });

    return NextResponse.json({ message: 'Health report deleted successfully' });
  } catch (error) {
    console.error('Error in health reports DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
