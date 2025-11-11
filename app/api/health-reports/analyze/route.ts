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

    // Detect language from content first
    const contentLanguage = detectLanguage(content);
    console.log(`🌍 Detected language from content: ${contentLanguage}`);
    
    const systemPrompt = `You are a medical AI assistant analyzing a health report. Return a concise patient-friendly summary AND a detailed analysis.

🚨 CRITICAL LANGUAGE REQUIREMENT 🚨
- You MUST respond ONLY in ${contentLanguage}
- DO NOT include translations in other languages
- DO NOT write "English:", "Español:", "Français:", "Deutsch:", "Português:", "简体中文:", or any language labels
- DO NOT provide multiple language versions
- Your ENTIRE response (summary, analysis, keyFindings, recommendations) must be in ${contentLanguage} ONLY

Respond STRICTLY as compact JSON with this exact schema (no markdown, no explanations, no code fences):
{"summary": string, "analysis": string, "keyFindings": string[], "recommendations": string[], "riskLevel": "low"|"normal"|"moderate"|"high"|"critical"}

Rules:
- summary: 3-6 sentences, clear layperson language, no markdown, in ${contentLanguage} ONLY
- analysis: full detailed analysis; paragraphs allowed, but no markdown syntax, in ${contentLanguage} ONLY
- keyFindings: 3-10 bullet items, short phrases, in ${contentLanguage} ONLY
- recommendations: 2-8 actionable items, in ${contentLanguage} ONLY
- riskLevel: one of: low, normal, moderate, high, critical

Context:
Report Type: ${reportType || 'General Health Report'}
Filename: ${filename || 'Unknown'}

IMPORTANT: All text in your response must be in ${contentLanguage} only. Do not include any other languages.

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
          
          // Filter all fields to ensure single language
          const detectedLang = detectLanguage(aiAnalysis || content);
          if (aiAnalysis) aiAnalysis = extractSingleLanguage(aiAnalysis, detectedLang);
          if (aiSummary) aiSummary = extractSingleLanguage(aiSummary, detectedLang);
          if (aiKeyFindings) aiKeyFindings = aiKeyFindings.map((f: string) => extractSingleLanguage(f, detectedLang));
          if (aiRecommendations) aiRecommendations = aiRecommendations.map((r: string) => extractSingleLanguage(r, detectedLang));
          
          console.log('AI JSON parsed successfully');
        } catch (e) {
          console.warn('Failed to parse AI JSON, will fallback to text parsing:', e);
          aiAnalysis = raw || 'Analysis not available';
        }
      } else {
        aiAnalysis = raw || 'Analysis not available';
        // Filter analysis to ensure single language
        const detectedLang = detectLanguage(aiAnalysis || content);
        aiAnalysis = extractSingleLanguage(aiAnalysis, detectedLang);
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
    
    // Final language filtering pass to ensure everything is in the same language
    const finalDetectedLang = detectLanguage(aiAnalysis || content);
    const finalAnalysis = extractSingleLanguage(aiAnalysis, finalDetectedLang);
    const finalSummary = extractSingleLanguage(summary, finalDetectedLang);
    const finalKeyFindings = keyFindings.map((f: string) => extractSingleLanguage(f, finalDetectedLang));
    const finalRecommendations = recommendations.map((r: string) => extractSingleLanguage(r, finalDetectedLang));

    return NextResponse.json({
      analysis: finalAnalysis,
      summary: finalSummary,
      keyFindings: finalKeyFindings,
      recommendations: finalRecommendations,
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
  if (!text || text.length === 0) return 'English';
  
  // Count characters from different language families
  const cyrillicCount = (text.match(/[\u0400-\u04FF]/g) || []).length;
  const chineseCount = (text.match(/[\u4E00-\u9FFF]/g) || []).length;
  const arabicCount = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const spanishCount = (text.match(/[ñáéíóúüÑÁÉÍÓÚÜ]/g) || []).length;
  const frenchCount = (text.match(/[àâäéèêëïîôùûüÿçÀÂÄÉÈÊËÏÎÔÙÛÜŸÇ]/g) || []).length;
  const germanCount = (text.match(/[äöüßÄÖÜ]/g) || []).length;
  const portugueseCount = (text.match(/[ãõáéíóúâêôçÃÕÁÉÍÓÚÂÊÔÇ]/g) || []).length;
  
  // If more than 20% of characters are from a specific language family, use that language
  const totalChars = text.length;
  if (cyrillicCount > totalChars * 0.2) return 'Russian';
  if (chineseCount > totalChars * 0.2) return 'Chinese';
  if (arabicCount > totalChars * 0.2) return 'Arabic';
  if (spanishCount > totalChars * 0.1) return 'Spanish';
  if (frenchCount > totalChars * 0.1) return 'French';
  if (germanCount > totalChars * 0.1) return 'German';
  if (portugueseCount > totalChars * 0.1) return 'Portuguese';
  
  // Default to English
  return 'English';
}

// Extract only the detected language from multi-language text
function extractSingleLanguage(text: string, detectedLanguage: string): string {
  if (!text) return '';
  
  // Language label patterns (case-insensitive)
  const languageLabels: Record<string, RegExp[]> = {
    'English': [/^English\s*:?\s*/i, /English\s*:?\s*/i],
    'Spanish': [/^Español\s*:?\s*/i, /^Spanish\s*:?\s*/i, /Español\s*:?\s*/i],
    'French': [/^Français\s*:?\s*/i, /^French\s*:?\s*/i, /Français\s*:?\s*/i],
    'German': [/^Deutsch\s*:?\s*/i, /^German\s*:?\s*/i, /Deutsch\s*:?\s*/i],
    'Portuguese': [/^Português\s*:?\s*/i, /^Portuguese\s*:?\s*/i, /Português\s*:?\s*/i],
    'Russian': [/^Русский\s*:?\s*/i, /^Russian\s*:?\s*/i, /Русский\s*:?\s*/i],
    'Chinese': [/^简体中文\s*:?\s*/i, /^中文\s*:?\s*/i, /^Chinese\s*:?\s*/i, /简体中文\s*:?\s*/i],
    'Arabic': [/^العربية\s*:?\s*/i, /^Arabic\s*:?\s*/i, /العربية\s*:?\s*/i],
  };
  
  // Check if text contains multiple language labels
  const hasMultipleLanguages = Object.values(languageLabels).some(patterns => 
    patterns.some(pattern => pattern.test(text))
  );
  
  if (!hasMultipleLanguages) {
    // No language labels found, return as-is (but clean up any stray labels)
    return text
      .replace(/^(English|Español|Français|Deutsch|Português|Russian|简体中文|中文|Chinese|Arabic|العربية):\s*/i, '')
      .trim();
  }
  
  // Extract the section for the detected language
  const detectedPatterns = languageLabels[detectedLanguage] || [];
  if (detectedPatterns.length === 0) {
    // Language not in our map, try to extract by detecting language characters
    return text;
  }
  
  // Try to find the section for the detected language
  for (const pattern of detectedPatterns) {
    // Match from the label to the next language label or end of text
    const regex = new RegExp(`${pattern.source}([\\s\\S]*?)(?=\\s*(?:English|Español|Français|Deutsch|Português|Russian|简体中文|中文|Chinese|Arabic|العربية)\\s*:|$)`, 'i');
    const match = text.match(regex);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // If we can't find the detected language section, try to extract the first substantial block
  // Split by language labels and take the longest non-empty block
  const parts = text.split(/\s*(?:English|Español|Français|Deutsch|Português|Russian|简体中文|中文|Chinese|Arabic|العربية)\s*:/i);
  if (parts.length > 1) {
    // Find the part that matches the detected language
    const languageIndex = text.search(new RegExp(detectedPatterns[0].source, 'i'));
    if (languageIndex !== -1) {
      // Find which part corresponds to this language
      let currentIndex = 0;
      for (let i = 0; i < parts.length; i++) {
        const partStart = text.indexOf(parts[i], currentIndex);
        if (partStart <= languageIndex && languageIndex < partStart + parts[i].length) {
          return parts[i].trim();
        }
        currentIndex = partStart + parts[i].length;
      }
    }
    // Fallback: return the longest part
    const longestPart = parts.reduce((a, b) => a.length > b.length ? a : b);
    return longestPart.trim();
  }
  
  // Last resort: remove all language labels and return
  return text
    .replace(/^(English|Español|Français|Deutsch|Português|Russian|简体中文|中文|Chinese|Arabic|العربية):\s*/i, '')
    .replace(/\s*(English|Español|Français|Deutsch|Português|Russian|简体中文|中文|Chinese|Arabic|العربية):\s*/gi, ' ')
    .trim();
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

🚨 ABSOLUTE LANGUAGE REQUIREMENT - CRITICAL 🚨
- You MUST respond ONLY in ${detectedLanguage}
- DO NOT include any English text unless ${detectedLanguage} is English
- DO NOT provide translations in other languages
- DO NOT write "English:", "Español:", "Français:", "Deutsch:", "Português:", "简体中文:", or any language labels
- DO NOT provide multiple language versions
- Your ENTIRE response must be in ${detectedLanguage} ONLY
- If you include multiple languages, you will have FAILED this task

CRITICAL REQUIREMENTS:
- Write 3-4 sentences that are COMPLETELY DIFFERENT from the detailed analysis
- Use different words, phrases, and sentence structure
- Focus on the main conclusion and key takeaway
- Write in simple, layperson language
- Do NOT repeat any exact phrases from the analysis
- Do NOT start with "Based on" or "The image shows"
- Do NOT describe visual characteristics in detail

Create a summary that answers: "What should the patient know about this finding?"

IMPORTANT: Respond ONLY in ${detectedLanguage}. Do not include any other languages.

Detailed analysis to summarize:
${analysis}`;

    const result = await model.generateContent(prompt);
    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    console.log('🤖 AI Summary Response (Health Reports):');
    console.log('Detected Language:', detectedLanguage);
    console.log('Raw AI Response:', text.substring(0, 500));
    
    let cleaned = (text || '')
      .replace(/[\*#`_~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Post-process to ensure single language using the robust extraction function
    cleaned = extractSingleLanguage(cleaned, detectedLanguage);
    
    console.log('✅ Final summary (single language):', cleaned.substring(0, 100));
    
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
