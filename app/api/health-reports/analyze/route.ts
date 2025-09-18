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
    // ALWAYS generate a separate, distinct AI summary - never use analysis text
    console.log('🔄 Generating separate AI summary for health report...');
    let summary: string = '';
    try {
      const aiSum = await generateDistinctSummary(aiAnalysis);
      if (aiSum && !isSummaryRedundant(aiAnalysis, aiSum)) {
        summary = normalizeSummary(aiSum);
        console.log('✅ Generated distinct AI summary for health report');
      } else {
        console.log('⚠️ AI summary still redundant, using heuristic');
        summary = normalizeSummary(deriveSummaryHeuristic(aiAnalysis));
      }
    } catch (error) {
      console.log('❌ AI summary generation failed, using heuristic');
      summary = normalizeSummary(deriveSummaryHeuristic(aiAnalysis));
    }
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
  const summaryMatch = analysis.match(/\*\*Report Summary\*\*:?:\s*([^*]+?)(?=\*\*|$)/i);
  if (summaryMatch && summaryMatch[1]) return normalizeSummary(summaryMatch[1]);
  return normalizeSummary(deriveSummaryHeuristic(analysis));
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

// --- Helpers to ensure distinct, paraphrased summaries ---

// Helper function to detect the primary language of text
function detectLanguage(text: string): string {
  // Count characters from different language families
  const cyrillicCount = (text.match(/[\u0400-\u04FF]/g) || []).length;
  const chineseCount = (text.match(/[\u4E00-\u9FFF]/g) || []).length;
  const arabicCount = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const spanishCount = (text.match(/[ñáéíóúü]/gi) || []).length;
  
  // If more than 20% of characters are from a specific language family, use that language
  const totalChars = text.length;
  if (cyrillicCount > totalChars * 0.2) return 'Russian';
  if (chineseCount > totalChars * 0.2) return 'Chinese';
  if (arabicCount > totalChars * 0.2) return 'Arabic';
  if (spanishCount > totalChars * 0.1) return 'Spanish';
  
  // Default to English
  return 'English';
}

function normalizeSummary(text: string): string {
  const t = (text || '')
    .replace(/[\*#`_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return t
    .replace(/^based on the (image|report) provided[,\s]*/i, '')
    .replace(/^here is (an )?analysis of (the )?(skin )?lesion[,\s]*/i, '')
    .replace(/^this (report|analysis) (shows|indicates|suggests)[,\s]*/i, '')
    .trim();
}

function sanitize(text: string): string {
  return (text || '')
    .replace(/\s+/g, ' ')
    .replace(/[\*#`_~]/g, '')
    .trim()
    .toLowerCase();
}

function isSummaryRedundant(analysis: string, summary: string): boolean {
  if (!analysis || !summary) return false;
  const a = sanitize(analysis);
  const s = sanitize(summary);
  if (s.length < 50) return true;
  const analysisStart = a.slice(0, Math.max(s.length * 1.5, 400));
  const containment = analysisStart.includes(s) || s.includes(analysisStart.slice(0, s.length));
  const summaryWords = s.split(' ').filter(w => w.length > 2);
  const analysisStartWords = analysisStart.split(' ').filter(w => w.length > 2);
  const matchingWords = summaryWords.filter(word => analysisStartWords.includes(word));
  const wordOverlap = summaryWords.length > 0 ? matchingWords.length / summaryWords.length : 0;
  const endsAbruptly = s.endsWith('...') || /(textur|appear|surfac|color|lesion)$/i.test(s);
  return containment || wordOverlap > 0.7 || endsAbruptly;
}

async function generateDistinctSummary(analysis: string): Promise<string | null> {
  try {
    // Detect the language of the analysis
    const detectedLanguage = detectLanguage(analysis);
    console.log(`🌍 Detected language for summary: ${detectedLanguage}`);
    
    const projectId = process.env.GOOGLE_VERTEX_PROJECT;
    const location = process.env.GOOGLE_VERTEX_LOCATION || 'us-central1';
    const credentialsBase64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
    if (!projectId || !credentialsBase64) return null;
    
    const credentialsJson = Buffer.from(credentialsBase64, 'base64').toString('utf-8');
    const parsedCredentials = JSON.parse(credentialsJson);
    const { VertexAI } = await import('@google-cloud/vertexai');
    const vertexAI = new VertexAI({
      project: projectId,
      location,
      googleAuthOptions: { credentials: { client_email: parsedCredentials.client_email, private_key: parsedCredentials.private_key } },
    });
    const model = vertexAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
    
    // STRICT instructions to create a completely different summary
    const prompt = `You are a medical AI creating a patient-friendly summary. 

LANGUAGE REQUIREMENT: Respond ONLY in ${detectedLanguage}. Do not provide translations in other languages.

CRITICAL REQUIREMENTS:
- Write 3-4 sentences that are COMPLETELY DIFFERENT from the detailed analysis
- Use different words, phrases, and sentence structure
- Focus on the main conclusion and key takeaway
- Write in simple, layperson language
- Do NOT repeat any exact phrases from the analysis
- Do NOT start with "Based on" or "The image shows"
- Do NOT describe visual characteristics in detail
- Respond ONLY in ${detectedLanguage} - do not include English translations or other languages

Create a summary that answers: "What should the patient know about this finding?"

Detailed analysis to summarize:
${analysis}`;

    const result = await model.generateContent(prompt);
    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = (text || '')
      .replace(/[\*#`_~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    return cleaned || null;
  } catch (error) {
    console.error('Error generating distinct summary:', error);
    return null;
  }
}

function deriveSummaryHeuristic(analysis: string): string {
  const text = (analysis || '').replace(/[\*#`_~]/g, '').replace(/\s+/g, ' ').trim();
  if (!text) return 'Summary not available';
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 25 && s.length < 300);
  if (sentences.length === 0) return text.slice(0, 400) + (text.length > 400 ? '...' : '');
  const ranked = sentences
    .map((s, i) => ({ s, i, score: scoreSentenceForSummary(s, i) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .sort((a, b) => a.i - b.i)
    .map(x => x.s);
  const summary = ranked.join(' ');
  return summary.length >= 200 ? summary : (text.slice(0, 500) + (text.length > 500 ? '...' : ''));
}

function scoreSentenceForSummary(s: string, index: number): number {
  let score = 0;
  const lower = s.toLowerCase();
  if (index < 5) score += 1;
  if (/[a-z]/i.test(s)) score += 1;
  if (!/[\:\;\-•\*]/.test(s)) score += 1;
  if (/(overall|in summary|suggests|likely|appears|consistent with|recommend|follow up|monitor)/.test(lower)) score += 2;
  if (s.length >= 60 && s.length <= 220) score += 1;
  return score;
}
