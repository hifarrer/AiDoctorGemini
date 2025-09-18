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

    // Ensure we have a true AI-generated summary/structure
    let finalSummary: string | null = typeof aiSummary === 'string' ? aiSummary : null;
    let finalAnalysis: string | null = typeof aiAnalysis === 'string' ? aiAnalysis : null;
    let finalFindings: string[] | null = Array.isArray(keyFindings) ? keyFindings : null;
    let finalRecs: string[] | null = Array.isArray(recommendations) ? recommendations : null;
    let finalRisk: string | null = typeof riskLevel === 'string' ? riskLevel : null;

    // If the summary is missing/weak or clearly a trimmed copy of the analysis, ask the AI to return JSON with both
    const isRedundant = finalAnalysis && finalSummary && isSummaryRedundant(finalAnalysis, finalSummary);
    console.log('🔍 Summary redundancy check:', {
      hasSummary: !!finalSummary,
      summaryLength: finalSummary?.length || 0,
      isRedundant,
      summaryPreview: finalSummary?.substring(0, 100) + '...',
      analysisPreview: finalAnalysis?.substring(0, 100) + '...'
    });
    
    if (!finalSummary || (finalSummary && (finalSummary.length < 60 || isRedundant))) {
      try {
        // Validate environment variables for Vertex
        const projectId = process.env.GOOGLE_VERTEX_PROJECT;
        const location = process.env.GOOGLE_VERTEX_LOCATION || 'us-central1';
        const credentialsBase64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;

        if (!projectId || !credentialsBase64) {
          throw new Error('AI configuration missing');
        }

        const credentialsJson = Buffer.from(credentialsBase64, 'base64').toString('utf-8');
        const parsedCredentials = JSON.parse(credentialsJson);

        const { VertexAI } = await import('@google-cloud/vertexai');
        const vertexAI = new VertexAI({
          project: projectId,
          location,
          googleAuthOptions: {
            credentials: {
              client_email: parsedCredentials.client_email,
              private_key: parsedCredentials.private_key,
            },
          },
        });

        const model = vertexAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

        const systemPrompt = `You are a medical AI analyzing an image analysis report. Return a concise patient-friendly summary AND a detailed analysis.
Respond STRICTLY as compact JSON with this exact schema (no markdown, no explanations, no code fences):
{"summary": string, "analysis": string, "keyFindings": string[], "recommendations": string[], "riskLevel": "low"|"normal"|"moderate"|"high"|"critical"}
Rules:\n- summary: 3-6 sentences, layperson language, no markdown\n- analysis: full detailed analysis; paragraphs allowed, no markdown\n- keyFindings: 3-10 short bullet items\n- recommendations: 2-8 actionable items\n- riskLevel: one of: low, normal, moderate, high, critical\n`;

        const contentForAI = (finalAnalysis || '').trim();
        if (contentForAI.length > 0) {
          const prompt = `${systemPrompt}\n\nAnalyze this content derived from the image: \n${contentForAI}`;
          const result = await model.generateContent(prompt);
          const raw = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const jsonText = extractJSON(raw);
          if (jsonText) {
            try {
              const parsed = JSON.parse(jsonText);
              finalSummary = typeof parsed.summary === 'string' ? parsed.summary.trim() : finalSummary;
              finalAnalysis = typeof parsed.analysis === 'string' ? parsed.analysis.trim() : finalAnalysis;
              finalFindings = Array.isArray(parsed.keyFindings) ? parsed.keyFindings.map((x: any) => String(x)).filter(Boolean) : finalFindings;
              finalRecs = Array.isArray(parsed.recommendations) ? parsed.recommendations.map((x: any) => String(x)).filter(Boolean) : finalRecs;
              finalRisk = typeof parsed.riskLevel === 'string' ? parsed.riskLevel.toLowerCase() : finalRisk;
            } catch (e) {
              // Fallback parsing below
            }
          }
        }
      } catch (e) {
        // If AI call fails, continue with fallback extraction below
      }
    }

    // Fallback extraction from analysis text if any fields still missing
    if (finalAnalysis) {
      if (!finalSummary) finalSummary = extractSummary(finalAnalysis);
      if (!finalFindings) finalFindings = extractKeyFindings(finalAnalysis);
      if (!finalRecs) finalRecs = extractRecommendations(finalAnalysis);
      if (!finalRisk) finalRisk = extractRiskLevel(finalAnalysis);
    }

    // Create a health report entry for the image analysis
    const { data: healthReport, error } = await supabase
      .from('health_reports')
      .insert({
        user_id: user.id,
        title: title || `Image Analysis - ${imageFilename}`,
        report_type: 'image_analysis',
        original_filename: imageFilename,
        file_content: finalAnalysis || aiAnalysis, // Store the full AI analysis
        file_size: imageData ? Math.round(imageData.length * 0.75) : 0, // Approximate size
        mime_type: imageMimeType,
        ai_analysis: finalAnalysis || aiAnalysis,
        ai_summary: finalSummary || aiSummary,
        key_findings: finalFindings || keyFindings,
        recommendations: finalRecs || recommendations,
        risk_level: (finalRisk || riskLevel || 'normal'),
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

// Shared helpers reused from analyze route
function extractJSON(input: string): string | null {
  if (!input) return null;
  const cleaned = input.trim()
    .replace(/^```(json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  if (cleaned.startsWith('{') && cleaned.endsWith('}')) return cleaned;
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) return cleaned.slice(start, end + 1);
  return null;
}

function isSummaryRedundant(analysis: string, summary: string): boolean {
  if (!analysis || !summary) return false;
  
  // Normalize both texts
  const a = sanitize(analysis);
  const s = sanitize(summary);
  
  // If summary is very short, it's likely incomplete
  if (s.length < 50) return true;
  
  // Check if summary is contained in the first part of analysis (truncated copy)
  const analysisStart = a.slice(0, Math.max(s.length * 1.5, 400));
  const containment = analysisStart.includes(s) || s.includes(analysisStart.slice(0, s.length));
  
  // Check word overlap - if more than 70% of summary words are in analysis start, it's redundant
  const summaryWords = s.split(' ').filter(w => w.length > 2); // ignore short words
  const analysisStartWords = analysisStart.split(' ').filter(w => w.length > 2);
  const matchingWords = summaryWords.filter(word => analysisStartWords.includes(word));
  const wordOverlap = summaryWords.length > 0 ? matchingWords.length / summaryWords.length : 0;
  
  // Check if summary ends abruptly (indicates truncation)
  const endsAbruptly = s.endsWith('...') || s.endsWith('textur') || s.endsWith('appear') || 
                      s.endsWith('surfac') || s.endsWith('color') || s.endsWith('lesion');
  
  return containment || wordOverlap > 0.7 || endsAbruptly;
}

function sanitize(text: string): string {
  return (text || '')
    .replace(/\s+/g, ' ')
    .replace(/[\*#`_~]/g, '')
    .trim()
    .toLowerCase();
}

function jaccardSimilarity(a: string, b: string): number {
  const arrA = Array.from(new Set(a.split(' ').filter(Boolean)));
  const arrB = Array.from(new Set(b.split(' ').filter(Boolean)));
  const intersectionCount = arrA.filter(x => arrB.indexOf(x) !== -1).length;
  const unionCount = Array.from(new Set(arrA.concat(arrB))).length;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

function extractSummary(analysis: string): string {
  if (!analysis || typeof analysis !== 'string') return 'Summary not available';
  const summaryMatch = analysis.match(/\*\*Report Summary\*\*:?:\s*([^*]+?)(?=\*\*|$)/i);
  if (summaryMatch && summaryMatch[1]) return summaryMatch[1].trim();
  return analysis.substring(0, 200).trim() + (analysis.length > 200 ? '...' : '');
}

function extractKeyFindings(analysis: string): string[] {
  if (!analysis || typeof analysis !== 'string') return [];
  const findingsMatch = analysis.match(/\*\*Key Findings\*\*:?:\s*([\s\S]*?)(?=\*\*|$)/i);
  if (!findingsMatch || !findingsMatch[1]) return [];
  return findingsMatch[1]
    .split(/[•\-\*]\s*/)
    .map(f => f.trim())
    .filter(f => f.length > 0 && f.length < 200)
    .slice(0, 10);
}

function extractRecommendations(analysis: string): string[] {
  if (!analysis || typeof analysis !== 'string') return [];
  const recommendationsMatch = analysis.match(/\*\*Recommendations\*\*:?:\s*([\s\S]*?)(?=\*\*|$)/i);
  if (!recommendationsMatch || !recommendationsMatch[1]) return [];
  return recommendationsMatch[1]
    .split(/[•\-\*]\s*/)
    .map(r => r.trim())
    .filter(r => r.length > 0 && r.length < 200)
    .slice(0, 8);
}

function extractRiskLevel(analysis: string): string {
  if (!analysis || typeof analysis !== 'string') return 'normal';
  const riskMatch = analysis.match(/\*\*Risk Assessment\*\*:?:\s*(low|normal|moderate|high|critical)/i);
  if (riskMatch && riskMatch[1]) return riskMatch[1].toLowerCase();
  const lower = analysis.toLowerCase();
  if (lower.includes('critical') || lower.includes('urgent')) return 'critical';
  if (lower.includes('high risk') || lower.includes('concerning')) return 'high';
  if (lower.includes('moderate') || lower.includes('elevated')) return 'moderate';
  if (lower.includes('low risk') || lower.includes('normal')) return 'low';
  return 'normal';
}
