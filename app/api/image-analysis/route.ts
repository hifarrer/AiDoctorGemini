import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';

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
      imageData, 
      imageFilename, 
      imageMimeType,
      aiAnalysis,
      aiSummary,
      keyFindings,
      recommendations,
      riskLevel
    } = body;

    // Create a health report entry for the image analysis
    const { data: healthReport, error } = await supabase
      .from('health_reports')
      .insert({
        user_id: user.id,
        title: title || `Image Analysis - ${imageFilename}`,
        report_type: 'image_analysis',
        original_filename: imageFilename,
        file_content: aiAnalysis, // Store the full AI analysis
        file_size: imageData ? Math.round(imageData.length * 0.75) : 0, // Approximate size
        mime_type: imageMimeType,
        ai_analysis: aiAnalysis,
        ai_summary: aiSummary,
        key_findings: keyFindings,
        recommendations: recommendations,
        risk_level: riskLevel || 'normal',
        image_data: imageData, // Store the base64 image data
        image_filename: imageFilename,
        image_mime_type: imageMimeType,
        analysis_type: 'image'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating image analysis report:', error);
      return NextResponse.json({ error: 'Failed to create image analysis report' }, { status: 500 });
    }

    // Add history entry
    await supabase
      .from('health_report_history')
      .insert({
        health_report_id: healthReport.id,
        user_id: user.id,
        action: 'image_analyzed',
        details: { title, image_filename: imageFilename }
      });

    return NextResponse.json({ healthReport });
  } catch (error) {
    console.error('Error in image analysis POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
