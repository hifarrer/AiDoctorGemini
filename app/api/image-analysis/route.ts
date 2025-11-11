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
      aiAnalysis
    } = body;

    // STEP 1: Get detailed analysis from AI (if not provided)
    console.log('🔍 Starting two-step image analysis process...');
    let detailedAnalysis: string;
    
    if (aiAnalysis && typeof aiAnalysis === 'string' && aiAnalysis.trim().length > 50) {
      detailedAnalysis = aiAnalysis.trim();
      console.log('✅ Using provided detailed analysis');
    } else {
      console.log('🔄 Step 1: Generating detailed analysis...');
      detailedAnalysis = await generateDetailedAnalysis(imageData, imageMimeType);
      console.log('✅ Step 1 complete: Generated detailed analysis');
    }

    // STEP 2: Generate separate summary from the detailed analysis
    console.log('🔄 Step 2: Generating separate summary...');
    const summaryResult = await generateSeparateSummary(detailedAnalysis);
    console.log('✅ Step 2 complete: Generated separate summary');

    // Clean and format all content for PDF (remove markdown, support multi-language)
    const finalAnalysis = cleanTextForPDF(detailedAnalysis);
    const finalSummary = cleanTextForPDF(summaryResult.summary);
    const finalFindings = summaryResult.keyFindings.map(f => cleanTextForPDF(f));
    const finalRecs = summaryResult.recommendations.map(r => cleanTextForPDF(r));
    const finalRisk = summaryResult.riskLevel || 'normal';

    // Create a health report entry for the image analysis
    const { data: healthReport, error } = await supabase
      .from('health_reports')
      .insert({
        user_id: user.id,
        title: title || `Image Analysis - ${imageFilename}`,
        report_type: 'image_analysis',
        original_filename: imageFilename,
        file_content: finalAnalysis,
        file_size: imageData ? Math.round(imageData.length * 0.75) : 0,
        mime_type: imageMimeType,
        ai_analysis: finalAnalysis,
        ai_summary: finalSummary,
        key_findings: finalFindings,
        recommendations: finalRecs,
        risk_level: finalRisk,
        image_data: imageData,
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

// NEW FUNCTIONS FOR TWO-STEP ANALYSIS

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

async function generateDetailedAnalysis(imageData: string, imageMimeType: string): Promise<string> {
  try {
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

    const prompt = `You are a medical AI analyzing a skin lesion image. Provide a comprehensive, detailed medical analysis.

🚨 CRITICAL LANGUAGE REQUIREMENT 🚨
- You MUST respond in a SINGLE language only
- DO NOT include translations in other languages
- DO NOT write "English:", "Español:", "Français:", "Deutsch:", "Português:", "简体中文:", or any language labels
- DO NOT provide multiple language versions
- Your ENTIRE response must be in ONE language ONLY

REQUIREMENTS:
- Write in clear medical language
- Include all visual observations
- Discuss possible diagnoses
- Note any concerning features
- Provide detailed assessment
- Use plain text only (no markdown symbols like ** or ### or *)
- Respond in ONE language only - do not provide translations

Analyze this skin lesion image thoroughly:`;

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: imageData.replace(/^data:image\/[a-z]+;base64,/, ''),
              mimeType: imageMimeType
            }
          }
        ]
      }]
    });
    let analysis = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!analysis || analysis.length < 100) {
      throw new Error('Generated analysis too short');
    }

    // Filter analysis to ensure single language
    const detectedLang = detectLanguage(analysis);
    analysis = extractSingleLanguage(analysis.trim(), detectedLang);

    return analysis;
  } catch (error) {
    console.error('Error generating detailed analysis:', error);
    throw new Error('Failed to generate detailed analysis');
  }
}

async function generateSeparateSummary(detailedAnalysis: string): Promise<{
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  riskLevel: string;
}> {
  // Detect the language of the detailed analysis
  const detectedLanguage = detectLanguage(detailedAnalysis);
  console.log(`🌍 Detected language: ${detectedLanguage}`);
  try {
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

    const prompt = `You are creating a patient-friendly summary from a detailed medical analysis. 

CRITICAL: Your response must be COMPLETELY DIFFERENT from the detailed analysis. Do not copy or paraphrase the analysis text.

🚨 ABSOLUTE LANGUAGE REQUIREMENT - CRITICAL 🚨
- You MUST respond ONLY in ${detectedLanguage}
- DO NOT include any English text unless ${detectedLanguage} is English
- DO NOT provide translations in other languages
- DO NOT write "English:", "Español:", "Français:", "Deutsch:", "Português:", "简体中文:", or any language labels
- DO NOT provide multiple language versions
- Your ENTIRE response must be in ${detectedLanguage} ONLY
- If you include multiple languages, you will have FAILED this task

REQUIREMENTS:
- Create a SHORT summary (3-4 sentences) that tells the patient what they need to know
- Use simple, non-medical language
- Focus on conclusions and next steps, NOT detailed descriptions
- Remove all markdown symbols (no **, ###, *, etc.)
- Return as JSON with this exact structure:

{
  "summary": "Patient-friendly summary in ${detectedLanguage} only - NO OTHER LANGUAGES",
  "keyFindings": ["Finding 1 in ${detectedLanguage}", "Finding 2 in ${detectedLanguage}", "Finding 3 in ${detectedLanguage}"],
  "recommendations": ["Recommendation 1 in ${detectedLanguage}", "Recommendation 2 in ${detectedLanguage}"],
  "riskLevel": "low|normal|moderate|high|critical"
}

IMPORTANT: All text in your JSON response must be in ${detectedLanguage} only. Do not include any other languages.

Detailed medical analysis to summarize:
${detailedAnalysis}

JSON Response:`;

    const result = await model.generateContent(prompt);
    const response = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    console.log('🤖 AI Summary Response:');
    console.log('Detected Language:', detectedLanguage);
    console.log('Raw AI Response:', response.substring(0, 500));
    
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Post-process to ensure single language using the robust extraction function
    let finalSummary = parsed.summary || 'Summary not available';
    finalSummary = extractSingleLanguage(finalSummary, detectedLanguage);
    
    let finalKeyFindings = Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [];
    finalKeyFindings = finalKeyFindings.map((f: any) => extractSingleLanguage(String(f), detectedLanguage));
    
    let finalRecommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
    finalRecommendations = finalRecommendations.map((r: any) => extractSingleLanguage(String(r), detectedLanguage));
    
    console.log('✅ Final summary (single language):', finalSummary.substring(0, 100));
    
    return {
      summary: finalSummary,
      keyFindings: finalKeyFindings,
      recommendations: finalRecommendations,
      riskLevel: parsed.riskLevel || 'normal'
    };
  } catch (error) {
    console.error('Error generating separate summary:', error);
    // Fallback manual summary
    return createFallbackSummary(detailedAnalysis);
  }
}

function cleanTextForPDF(text: string): string {
  if (!text) return '';
  
  return text
    // Remove markdown formatting
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // Bold
    .replace(/\*([^*]+)\*/g, '$1')      // Italic
    .replace(/#{1,6}\s+/g, '')          // Headers
    .replace(/```[\s\S]*?```/g, '')     // Code blocks
    .replace(/`([^`]+)`/g, '$1')        // Inline code
    .replace(/^\s*[-*+]\s+/gm, '• ')    // Bullet points
    .replace(/^\s*\d+\.\s+/gm, '')      // Numbered lists
    // Clean up whitespace
    .replace(/\n\s*\n/g, '\n')          // Multiple newlines
    .replace(/\s+/g, ' ')               // Multiple spaces
    .trim();
}

function createFallbackSummary(analysis: string): {
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  riskLevel: string;
} {
  const text = analysis.toLowerCase();
  
  let summary = "This appears to be a skin growth that should be evaluated by a healthcare professional. ";
  let riskLevel = "normal";
  
  if (text.includes("melanoma") || text.includes("malignant") || text.includes("suspicious")) {
    summary = "This skin lesion shows features that require immediate medical evaluation. ";
    riskLevel = "high";
  } else if (text.includes("benign") || text.includes("seborrheic keratosis")) {
    summary = "This appears to be a benign skin growth that typically does not require treatment. ";
    riskLevel = "low";
  }
  
  summary += "A dermatologist can provide a definitive diagnosis and recommend appropriate care.";
  
  return {
    summary,
    keyFindings: ["Skin lesion identified", "Professional evaluation recommended"],
    recommendations: ["Consult with dermatologist", "Monitor for changes"],
    riskLevel
  };
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
