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
    const projectId = process.env.GOOGLE_VERTEX_PROJECT;
    const location = process.env.GOOGLE_VERTEX_LOCATION || 'us-central1';
    const credentialsBase64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;

    if (!projectId) {
      console.error('GOOGLE_VERTEX_PROJECT environment variable is not set');
      return NextResponse.json({ error: 'AI service configuration error' }, { status: 500 });
    }

    if (!credentialsBase64) {
      console.error('GOOGLE_APPLICATION_CREDENTIALS_BASE64 environment variable is not set');
      return NextResponse.json({ error: 'AI service credentials not configured' }, { status: 500 });
    }

    // Parse credentials
    let parsedCredentials;
    try {
      const credentialsJson = Buffer.from(credentialsBase64, 'base64').toString('utf-8');
      parsedCredentials = JSON.parse(credentialsJson);
    } catch (e: any) {
      console.error('Failed to decode/parse credentials from Base64:', e.message);
      return NextResponse.json({ error: 'Invalid server credentials format.' }, { status: 500 });
    }

    // Call the AI analysis API directly using VertexAI with explicit credentials
    const { VertexAI } = await import('@google-cloud/vertexai');
    
    const vertexAI = new VertexAI({
      project: projectId,
      location: location,
      googleAuthOptions: {
        credentials: {
          client_email: parsedCredentials.client_email,
          private_key: parsedCredentials.private_key,
        },
      },
    });

    const model = vertexAI.getGenerativeModel({
      model: 'gemini-2.5-pro',
    });

    const systemPrompt = `You are a medical AI assistant analyzing a health report. Return a concise patient-friendly summary AND a detailed analysis.

Respond STRICTLY as compact JSON with this exact schema (no markdown, no explanations, no code fences):
{"summary": string, "analysis": string, "keyFindings": string[], "recommendations": string[], "riskLevel": "low"|"normal"|"moderate"|"high"|"critical"}

Rules:
- summary: 3-6 sentences, clear layperson language, no markdown
- analysis: full detailed analysis; paragraphs allowed, but no markdown syntax
- keyFindings: 3-10 bullet items, short phrases
- recommendations: 2-8 actionable items
- riskLevel: one of: low, normal, moderate, high, critical

Context:
Report Type: ${reportType || 'General Health Report'}
Filename: ${filename || 'Unknown'}

Analyze the following content:`;

    const prompt = `${systemPrompt}\n\n${content}`;

    console.log('Starting health report analysis:', {
      contentLength: content.length,
      reportType,
      filename,
      promptLength: prompt.length
    });

    let aiAnalysis: string;
    let aiSummary: string | null = null;
    let aiKeyFindings: string[] | null = null;
    let aiRecommendations: string[] | null = null;
    let aiRisk: string | null = null;
    try {
      const result = await model.generateContent(prompt);
      const raw = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      // Try to parse strict JSON first (strip code fences if present)
      const jsonText = extractJSON(raw);
      if (jsonText) {
        try {
          const parsed = JSON.parse(jsonText);
          aiSummary = typeof parsed.summary === 'string' ? parsed.summary.trim() : null;
          aiAnalysis = typeof parsed.analysis === 'string' ? parsed.analysis.trim() : '';
          aiKeyFindings = Array.isArray(parsed.keyFindings) ? parsed.keyFindings.map((x: any) => String(x)).filter(Boolean) : null;
          aiRecommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations.map((x: any) => String(x)).filter(Boolean) : null;
          aiRisk = typeof parsed.riskLevel === 'string' ? parsed.riskLevel.toLowerCase() : null;
          console.log('AI JSON parsed successfully');
        } catch (e) {
          console.warn('Failed to parse AI JSON, will fallback to text parsing:', e);
          aiAnalysis = raw || 'Analysis not available';
        }
      } else {
        aiAnalysis = raw || 'Analysis not available';
      }
      console.log('AI analysis completed, length:', (aiAnalysis || '').length);
    } catch (aiError) {
      console.error('VertexAI error:', aiError);
      throw new Error(`AI analysis failed: ${aiError instanceof Error ? aiError.message : 'Unknown AI error'}`);
    }

    // If JSON parse failed, fall back to parsing text
    const summary = aiSummary ?? extractSummary(aiAnalysis);
    const keyFindings = aiKeyFindings ?? extractKeyFindings(aiAnalysis);
    const recommendations = aiRecommendations ?? extractRecommendations(aiAnalysis);
    const riskLevel = (aiRisk ?? extractRiskLevel(aiAnalysis)) as string;

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

// Extract a JSON object from a string that might contain extra text or code fences
function extractJSON(input: string): string | null {
  if (!input) return null;
  // Remove code fences if present
  const cleaned = input.trim()
    .replace(/^```(json)?/i, '')
    .replace(/```$/i, '')
    .trim();

  // Try straightforward parse first
  if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
    return cleaned;
  }

  // Fallback: find the first balanced JSON object
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    return cleaned.slice(start, end + 1);
  }
  return null;
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
  
  const findingsMatch = analysis.match(/\*\*Key Findings\*\*:?\s*([\s\S]*?)(?=\*\*|$)/i);
  if (!findingsMatch || !findingsMatch[1]) return [];
  
  const findings = findingsMatch[1]
    .split(/[•\-\*]\s*/)
    .map(f => f.trim())
    .filter(f => f.length > 0 && f.length < 200); // Filter out empty and too long findings
  
  return findings.slice(0, 10); // Limit to 10 findings
}

function extractRecommendations(analysis: string): string[] {
  if (!analysis || typeof analysis !== 'string') return [];
  
  const recommendationsMatch = analysis.match(/\*\*Recommendations\*\*:?\s*([\s\S]*?)(?=\*\*|$)/i);
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
