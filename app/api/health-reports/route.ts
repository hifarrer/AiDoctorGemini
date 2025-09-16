import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';

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

    const { data: healthReports, error } = await supabase
      .from('health_reports')
      .select(`
        id,
        title,
        report_type,
        original_filename,
        ai_summary,
        key_findings,
        recommendations,
        risk_level,
        created_at,
        updated_at,
        image_data,
        image_filename,
        image_mime_type,
        analysis_type
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching health reports:', error);
      return NextResponse.json({ error: 'Failed to fetch health reports' }, { status: 500 });
    }

    return NextResponse.json({ healthReports });
  } catch (error) {
    console.error('Error in health reports GET:', error);
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
    const { 
      title, 
      reportType, 
      originalFilename, 
      fileContent, 
      fileSize, 
      mimeType,
      aiAnalysis,
      aiSummary,
      keyFindings,
      recommendations,
      riskLevel
    } = body;

    const { data: healthReport, error } = await supabase
      .from('health_reports')
      .insert({
        user_id: user.id,
        title,
        report_type: reportType,
        original_filename: originalFilename,
        file_content: fileContent,
        file_size: fileSize,
        mime_type: mimeType,
        ai_analysis: aiAnalysis,
        ai_summary: aiSummary,
        key_findings: keyFindings,
        recommendations: recommendations,
        risk_level: riskLevel || 'normal'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating health report:', error);
      return NextResponse.json({ error: 'Failed to create health report' }, { status: 500 });
    }

    // Add history entry
    await supabase
      .from('health_report_history')
      .insert({
        health_report_id: healthReport.id,
        user_id: user.id,
        action: 'uploaded',
        details: { title, report_type: reportType }
      });

    return NextResponse.json({ healthReport });
  } catch (error) {
    console.error('Error in health reports POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
