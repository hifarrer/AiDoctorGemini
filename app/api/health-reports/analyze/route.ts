import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  let body: any = null;
  let content: string = '';
  let reportType: string = '';
  let filename: string = '';

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    body = await request.json();
    ({ content, reportType, filename } = body);

    if (!content) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    // Validate environment variables
    if (!process.env.GOOGLE_VERTEX_PROJECT) {
      console.error('GOOGLE_VERTEX_PROJECT environment variable is not set');
      return NextResponse.json({ error: 'AI service configuration error' }, { status: 500 });
    }

    // Call the AI analysis API directly using VertexAI
    const { VertexAI } = await import('@google-cloud/vertexai');
    
    const vertexAI = new VertexAI({
      project: process.env.GOOGLE_VERTEX_PROJECT!,
      location: process.env.GOOGLE_VERTEX_LOCATION || 'us-central1',
    });

    const model = vertexAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
    });

    const systemPrompt = `You are a medical AI assistant analyzing a health report. Please provide a comprehensive analysis including:

1. **Report Summary**: A clear, concise summary of the health report
2. **Key Findings**: List the most important findings, values, or observations
3. **Risk Assessment**: Assess the overall risk level (low, normal, moderate, high, critical)
4. **Recommendations**: Provide actionable recommendations for the patient
5. **Important Notes**: Any critical information that requires immediate attention

Format your response as a structured analysis that can be easily parsed. Be thorough but accessible to patients.

Report Type: ${reportType || 'General Health Report'}
Filename: ${filename || 'Unknown'}

Please analyze the following health report content:`;

    const prompt = `${systemPrompt}\n\n${content}`;

    console.log('Starting health report analysis:', {
      contentLength: content.length,
      reportType,
      filename,
      promptLength: prompt.length
    });

    let aiAnalysis: string;
    try {
      const result = await model.generateContent(prompt);
      aiAnalysis = result.response.candidates?.[0]?.content?.parts?.[0]?.text || 'Analysis not available';
      console.log('AI analysis completed, length:', aiAnalysis.length);
    } catch (aiError) {
      console.error('VertexAI error:', aiError);
      throw new Error(`AI analysis failed: ${aiError instanceof Error ? aiError.message : 'Unknown AI error'}`);
    }

    // Parse the analysis to extract structured data
    const summary = extractSummary(aiAnalysis);
    const keyFindings = extractKeyFindings(aiAnalysis);
    const recommendations = extractRecommendations(aiAnalysis);
    const riskLevel = extractRiskLevel(aiAnalysis);

    return NextResponse.json({
      analysis: aiAnalysis,
      summary,
      keyFindings,
      recommendations,
      riskLevel
    });

  } catch (error) {
    console.error('Error analyzing health report:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      contentLength: content?.length || 0,
      reportType: reportType,
      filename: filename
    });
    return NextResponse.json({ 
      error: 'Failed to analyze health report',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function extractSummary(analysis: string): string {
  if (!analysis || typeof analysis !== 'string') return 'Summary not available';
  
  const summaryMatch = analysis.match(/\*\*Report Summary\*\*:?\s*([^*]+?)(?=\*\*|$)/i);
  if (summaryMatch && summaryMatch[1]) {
    return summaryMatch[1].trim();
  }
  
  // Fallback: take first 200 characters
  return analysis.substring(0, 200).trim() + (analysis.length > 200 ? '...' : '');
}

function extractKeyFindings(analysis: string): string[] {
  if (!analysis || typeof analysis !== 'string') return [];
  
  const findingsMatch = analysis.match(/\*\*Key Findings\*\*:?\s*([^*]+?)(?=\*\*|$)/is);
  if (!findingsMatch || !findingsMatch[1]) return [];
  
  const findings = findingsMatch[1]
    .split(/[•\-\*]\s*/)
    .map(f => f.trim())
    .filter(f => f.length > 0 && f.length < 200); // Filter out empty and too long findings
  
  return findings.slice(0, 10); // Limit to 10 findings
}

function extractRecommendations(analysis: string): string[] {
  if (!analysis || typeof analysis !== 'string') return [];
  
  const recommendationsMatch = analysis.match(/\*\*Recommendations\*\*:?\s*([^*]+?)(?=\*\*|$)/is);
  if (!recommendationsMatch || !recommendationsMatch[1]) return [];
  
  const recommendations = recommendationsMatch[1]
    .split(/[•\-\*]\s*/)
    .map(r => r.trim())
    .filter(r => r.length > 0 && r.length < 200); // Filter out empty and too long recommendations
  
  return recommendations.slice(0, 8); // Limit to 8 recommendations
}

function extractRiskLevel(analysis: string): string {
  if (!analysis || typeof analysis !== 'string') return 'normal';
  
  const riskMatch = analysis.match(/\*\*Risk Assessment\*\*:?\s*(low|normal|moderate|high|critical)/i);
  if (riskMatch && riskMatch[1]) {
    return riskMatch[1].toLowerCase();
  }
  
  // Fallback: look for risk indicators in the text
  const lowerAnalysis = analysis.toLowerCase();
  if (lowerAnalysis.includes('critical') || lowerAnalysis.includes('urgent')) return 'critical';
  if (lowerAnalysis.includes('high risk') || lowerAnalysis.includes('concerning')) return 'high';
  if (lowerAnalysis.includes('moderate') || lowerAnalysis.includes('elevated')) return 'moderate';
  if (lowerAnalysis.includes('low risk') || lowerAnalysis.includes('normal')) return 'low';
  
  return 'normal';
}
