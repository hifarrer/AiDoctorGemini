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

    // FORCE generate completely different summary - IGNORE any existing summary
    if (finalAnalysis) {
      console.log('🔄 FORCING separate AI summary generation...');
      finalSummary = null; // Reset any existing summary
      
      try {
        const forcedSummary = await forceDistinctSummary(finalAnalysis);
        if (forcedSummary && forcedSummary.length > 30) {
          finalSummary = forcedSummary;
          console.log('✅ FORCED distinct AI summary generated:', finalSummary.substring(0, 100));
        } else {
          console.log('❌ Forced summary failed, using manual construction');
          finalSummary = createManualSummary(finalAnalysis);
        }
      } catch (error) {
        console.log('❌ AI summary generation failed completely, using manual construction');
        finalSummary = createManualSummary(finalAnalysis);
      }

      // Fallback extraction for other fields only
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

async function forceDistinctSummary(analysis: string): Promise<string | null> {
  try {
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
    
    // EXTREMELY AGGRESSIVE prompt to force different content
    const prompt = `IGNORE the detailed analysis format. Write a SHORT patient summary that is COMPLETELY DIFFERENT.

FORBIDDEN WORDS/PHRASES - DO NOT USE:
- "Based on"
- "The image shows"  
- "Analysis"
- "lesion"
- "raised"
- "surface"
- "texture"
- "papular"
- "exophytic"
- "variegation"

REQUIRED FORMAT:
Write EXACTLY 2-3 sentences that tell a patient:
1. What this likely is (use simple terms like "growth", "spot", "mark")
2. What they should do about it
3. How concerning it is

Use completely different vocabulary. Focus on ADVICE, not description.

Medical findings: ${analysis}

PATIENT SUMMARY:`;

    const result = await model.generateContent(prompt);
    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = (text || '')
      .replace(/[\*#`_~]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/^(patient summary|summary):\s*/i, '')
      .trim();
    
    return cleaned || null;
  } catch (error) {
    console.error('Error forcing distinct summary:', error);
    return null;
  }
}

function createManualSummary(analysis: string): string {
  // Extract key medical terms and create a completely different summary
  const text = analysis.toLowerCase();
  
  let condition = "skin growth";
  let concern = "routine monitoring";
  let action = "discuss with your doctor";
  
  // Determine likely condition
  if (text.includes("melanoma") || text.includes("malignant")) {
    condition = "concerning skin mark";
    concern = "immediate medical attention";
    action = "see a dermatologist urgently";
  } else if (text.includes("seborrheic keratosis") || text.includes("benign")) {
    condition = "benign skin growth";
    concern = "routine monitoring";
    action = "monitor for changes";
  } else if (text.includes("nevus") || text.includes("mole")) {
    condition = "mole";
    concern = "routine monitoring";
    action = "check regularly for changes";
  }
  
  return `This appears to be a ${condition} that requires ${concern}. You should ${action} to determine if any treatment is needed. Regular skin checks are recommended to monitor for any changes.`;
}

function deriveSummaryHeuristic(analysis: string): string {
  const text = (analysis || '').replace(/[\*#`_~]/g, '').replace(/\s+/g, ' ').trim();
  if (!text) return 'Summary not available';
  // Split into sentences and pick 3-5 representative ones, avoiding the first 1:1 copy block
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 25 && s.length < 300);
  if (sentences.length === 0) return text.slice(0, 300) + (text.length > 300 ? '...' : '');
  // Prefer sentences that contain summary-like cues and avoid list-like fragments
  const ranked = sentences
    .map((s, i) => ({ s, i, score: scoreSentenceForSummary(s, i) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .sort((a, b) => a.i - b.i)
    .map(x => x.s);
  const summary = ranked.join(' ');
  return summary.length > 200 ? summary : (text.slice(0, 400) + (text.length > 400 ? '...' : ''));
}

function scoreSentenceForSummary(s: string, index: number): number {
  let score = 0;
  const lower = s.toLowerCase();
  if (index < 5) score += 1; // early sentences are often context
  if (/[a-z]/i.test(s)) score += 1; // avoid weird tokens
  if (!/[\:\;\-•\*]/.test(s)) score += 1; // avoid list-like
  if (/(overall|in summary|suggests|likely|appears|consistent with|recommend|follow up|monitor)/.test(lower)) score += 2;
  if (s.length >= 60 && s.length <= 220) score += 1; // good length
  return score;
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
