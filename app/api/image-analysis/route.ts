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

REQUIREMENTS:
- Write in clear medical language
- Include all visual observations
- Discuss possible diagnoses
- Note any concerning features
- Provide detailed assessment
- Use plain text only (no markdown symbols like ** or ### or *)
- Support multiple languages if needed

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
    const analysis = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (!analysis || analysis.length < 100) {
      throw new Error('Generated analysis too short');
    }

    return analysis.trim();
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

🚨 ABSOLUTE LANGUAGE REQUIREMENT 🚨
- You MUST respond ONLY in ${detectedLanguage}
- DO NOT include any English text
- DO NOT provide translations in other languages
- DO NOT write "English:" or "Russian:" or any language labels
- If the analysis is in ${detectedLanguage}, your summary must be ONLY in ${detectedLanguage}

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
    
    // Post-process to ensure single language
    let finalSummary = parsed.summary || 'Summary not available';
    
    // If summary contains multiple languages, extract only the detected language
    if (detectedLanguage === 'Russian' && finalSummary.includes('English:')) {
      const russianMatch = finalSummary.match(/Russian:\s*([^]*?)(?=English:|$)/);
      if (russianMatch) {
        finalSummary = russianMatch[1].trim();
        console.log('🔧 Extracted Russian-only summary:', finalSummary.substring(0, 100));
      }
    } else if (detectedLanguage === 'Chinese' && finalSummary.includes('English:')) {
      const chineseMatch = finalSummary.match(/Chinese:\s*([^]*?)(?=English:|$)/);
      if (chineseMatch) {
        finalSummary = chineseMatch[1].trim();
        console.log('🔧 Extracted Chinese-only summary:', finalSummary.substring(0, 100));
      }
    }
    
    // Remove any language labels that might remain
    finalSummary = finalSummary
      .replace(/^(English|Russian|Chinese|Spanish|Arabic):\s*/i, '')
      .replace(/\s*(English|Russian|Chinese|Spanish|Arabic):\s*/i, '')
      .trim();
    
    console.log('✅ Final summary (single language):', finalSummary.substring(0, 100));
    
    return {
      summary: finalSummary,
      keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
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
