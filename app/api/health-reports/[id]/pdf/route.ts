import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { PDFDocument, rgb, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
// Typed global cache for font bytes to avoid re-reading on every request
declare global {
  // eslint-disable-next-line no-var
  var __fontBytesCache: Record<string, Uint8Array> | undefined;
}


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data: healthReport, error } = await supabase
      .from('health_reports')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single();

    if (error || !healthReport) {
      return NextResponse.json({ error: 'Health report not found' }, { status: 404 });
    }

    // DEBUG: Check what data we're working with
    console.log('🔍 PDF Generation Debug Info:');
    console.log('Report ID:', params.id);
    console.log('Analysis Type:', healthReport.analysis_type);
    console.log('Summary Length:', healthReport.ai_summary?.length || 0);
    console.log('Analysis Length:', healthReport.ai_analysis?.length || 0);
    console.log('Summary Preview:', healthReport.ai_summary?.substring(0, 100) + '...');
    console.log('Analysis Preview:', healthReport.ai_analysis?.substring(0, 100) + '...');

    // Check if summary is still duplicate of analysis
    const isDuplicate = checkIfSummaryIsDuplicate(healthReport.ai_summary, healthReport.ai_analysis);
    console.log('🔍 Is Summary Duplicate?', isDuplicate);

    let finalSummary = healthReport.ai_summary;
    let finalAnalysis = healthReport.ai_analysis;

    // If it's an image analysis with duplicate summary, regenerate it
    if (isDuplicate && healthReport.analysis_type === 'image' && healthReport.ai_analysis) {
      console.log('🔄 Regenerating summary for duplicate content...');
      try {
        const newSummary = await regenerateSummary(healthReport.ai_analysis);
        if (newSummary && !checkIfSummaryIsDuplicate(newSummary, healthReport.ai_analysis)) {
          finalSummary = newSummary;
          console.log('✅ Generated new summary:', newSummary.substring(0, 100) + '...');
          
          // Update the database with the new summary
          await supabase
            .from('health_reports')
            .update({ ai_summary: newSummary })
            .eq('id', params.id);
          console.log('✅ Updated database with new summary');
        }
      } catch (error) {
        console.log('❌ Failed to regenerate summary:', error);
      }
    }

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size

    // Enable embedding of Unicode fonts
    pdfDoc.registerFontkit(fontkit);

    // Cache font bytes in module scope between requests
    if (!globalThis.__fontBytesCache) globalThis.__fontBytesCache = {} as Record<string, Uint8Array>;
    const fontCache: Record<string, Uint8Array> = globalThis.__fontBytesCache;

    const publicDir = path.join(process.cwd(), 'public', 'fonts');
    const files = {
      noto: path.join(publicDir, 'NotoSans-Regular.ttf'),
      notoBold: path.join(publicDir, 'NotoSans-Bold.ttf'),
      cjk: path.join(publicDir, 'NotoSansCJKsc-Regular.otf'),
      cjkBold: path.join(publicDir, 'NotoSansCJKsc-Bold.otf')
    } as const;

    console.log('🔤 Font files to load:', {
      noto: files.noto,
      notoBold: files.notoBold,
      cjk: files.cjk,
      cjkBold: files.cjkBold
    });

    const readFont = async (key: keyof typeof files): Promise<Uint8Array> => {
      if (fontCache[key]) {
        console.log(`✅ Using cached font: ${key}`);
        return fontCache[key];
      }
      try {
        console.log(`🔤 Loading local font: ${key} from ${files[key]}`);
        const bytes = await fs.readFile(files[key]);
        fontCache[key] = new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        console.log(`✅ Successfully loaded local font: ${key} (${bytes.length} bytes)`);
        return fontCache[key];
      } catch (e) {
        // Fallback to remote fetch only if local files are missing
        const remoteMap: Record<string, string> = {
          noto: 'https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf',
          notoBold: 'https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Bold.ttf',
          cjk: 'https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf',
          cjkBold: 'https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Bold.otf'
        };
        console.log(`⚠️ Local font ${key} not found, fetching from remote:`, remoteMap[key]);
        const url = remoteMap[key];
        const res = await fetch(url);
        const buf = await res.arrayBuffer();
        const bytes = new Uint8Array(buf);
        fontCache[key] = bytes;
        console.log(`✅ Successfully loaded remote font: ${key} (${bytes.length} bytes)`);
        return bytes;
      }
    };

    const [notoSansBytes, notoSansBoldBytes, cjkBytes, cjkBoldBytes] = await Promise.all([
      readFont('noto'),
      readFont('notoBold'),
      readFont('cjk'),
      readFont('cjkBold')
    ]);

    console.log('🔤 Loading fonts for PDF generation...');
    const unicodeFont: PDFFont = await pdfDoc.embedFont(notoSansBytes, { subset: false });
    const unicodeBoldFont: PDFFont = await pdfDoc.embedFont(notoSansBoldBytes, { subset: false });
    const cjkFont: PDFFont = await pdfDoc.embedFont(cjkBytes, { subset: false });
    const cjkBoldFont: PDFFont = await pdfDoc.embedFont(cjkBoldBytes, { subset: false });
    console.log('✅ All fonts loaded successfully');

    // Base Latin/Cyrillic fonts; we will dynamically switch to CJK when needed
    let font: PDFFont = unicodeFont;
    let boldFont: PDFFont = unicodeBoldFont;

    // Enhanced Unicode detection for better multi-language support
    const containsCJK = (text: string): boolean => /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/.test(text);
    const containsCyrillic = (text: string): boolean => /[\u0400-\u04FF]/.test(text);
    const containsArabic = (text: string): boolean => /[\u0600-\u06FF]/.test(text);
    
    const getFontFor = (text: string, isBold: boolean): PDFFont => {
      // CJK characters (Chinese, Japanese, Korean)
      if (containsCJK(text)) {
        console.log('🔤 Using CJK font for text:', text.substring(0, 50));
        return isBold ? cjkBoldFont : cjkFont;
      }
      // Cyrillic characters (Russian, etc.) - use Noto Sans which supports Cyrillic
      if (containsCyrillic(text)) {
        console.log('🔤 Using Noto Sans for Cyrillic text:', text.substring(0, 50));
        return isBold ? unicodeBoldFont : unicodeFont;
      }
      // Arabic characters
      if (containsArabic(text)) {
        console.log('🔤 Using Noto Sans for Arabic text:', text.substring(0, 50));
        return isBold ? unicodeBoldFont : unicodeFont;
      }
      // Default to Noto Sans for Latin and other scripts
      return isBold ? unicodeBoldFont : unicodeFont;
    };

    const { width, height } = page.getSize();
    let yPosition = height - 50;

    // Helper function to format AI response text for better PDF presentation
    const formatAIText = (text: string): string => {
      if (!text) return '';
      
      const originalText = text;
      const formattedText = text
        // Remove markdown headers (###, ##, #) and add proper spacing
        .replace(/^#{1,6}\s+/gm, '\n')
        // Convert bold markdown (**text** or __text__) to clean text
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        // Convert italic markdown (*text* or _text_) to clean text
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        // Convert bullet points to clean format with proper spacing
        .replace(/^\s*[-*+]\s+/gm, '\n• ')
        // Remove numbered lists formatting but keep content
        .replace(/^\s*\d+\.\s+/gm, '\n')
        // Handle specific patterns like "* **Color:**" -> "Color:"
        .replace(/\*\s*\*\*([^*]+)\*\*:\s*/g, '$1: ')
        // Handle patterns like "* **Shape and Border:**" -> "Shape and Border:"
        .replace(/\*\s*\*\*([^*]+)\*\*:\s*/g, '$1: ')
        // Clean up multiple line breaks and spaces
        .replace(/[\r\n\t]+/g, ' ')
        .replace(/\s+/g, ' ')
        // Remove any remaining markdown artifacts
        .replace(/[#*_`~]/g, '')
        // Clean up any double spaces that might have been created
        .replace(/\s+/g, ' ')
        .trim();
      
      // Debug logging to show formatting changes
      if (originalText !== formattedText) {
        console.log('📝 Text formatting applied:');
        console.log('Original:', originalText.substring(0, 200) + '...');
        console.log('Formatted:', formattedText.substring(0, 200) + '...');
      }
      
      return formattedText;
    };

    // Helper function to sanitize text for PDF (supports Unicode including Cyrillic, Arabic, Chinese, etc.)
    const sanitizeText = (text: string): string => {
      if (!text) return '';
      return text
        .replace(/[\r\n\t]/g, ' ') // Replace newlines, carriage returns, and tabs with spaces
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove only control characters, keep all Unicode
        .trim();
    };

    // We no longer mutate non-Latin text. We rely on Unicode fonts instead.
    const preprocessTextForPDF = (text: string): string => text || '';

    // Helper function to safely draw text (text should already be preprocessed)
    const safeDrawText = (page: any, text: string, options: any) => {
      try {
        // Replace any remaining forbidden control bytes defensively
        const safe = (text || '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
        page.drawText(safe, options);
      } catch (error) {
        console.error('PDF text rendering failed even after preprocessing:', error);
        console.error('Problematic text:', text.substring(0, 100));
        // Last resort: draw a placeholder
        page.drawText('[Text rendering error]', options);
      }
    };

    // Helper function to add text with word wrapping and page breaks
    const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 12, isBold: boolean = false, isAIContent: boolean = false) => {
      // Use dynamic font selection based on text content
      const fontToUse = getFontFor(text, isBold);
      
      console.log('📊 Processing text for PDF:');
      console.log('Step 0 - Original:', text.substring(0, 100) + '...');
      
      // Step 1: Format AI content to remove markdown
      let processedText = isAIContent ? formatAIText(text) : text;
      console.log('Step 1 - After markdown formatting:', processedText.substring(0, 100) + '...');
      
      // Step 2: Pre-process text for PDF compatibility (handle Unicode characters)
      processedText = preprocessTextForPDF(processedText);
      console.log('Step 2 - After Unicode preprocessing:', processedText.substring(0, 100) + '...');
      
      // Step 3: Final sanitization
      const sanitizedText = sanitizeText(processedText);
      console.log('Step 3 - Final sanitized text:', sanitizedText.substring(0, 100) + '...');
      
      const words = sanitizedText.split(' ');
      let line = '';
      let currentY = y;
      let currentPage = page;

      for (const word of words) {
        const testLine = line + word + ' ';
        const dynamicFont = getFontFor(testLine, isBold);
        const textWidth = dynamicFont.widthOfTextAtSize(testLine, fontSize);
        
        if (textWidth > maxWidth && line !== '') {
          // Check if we need a new page before drawing the line
          if (currentY < 100) {
            console.log('📄 Adding new page, currentY was:', currentY);
            const newPage = pdfDoc.addPage([595.28, 841.89]);
            currentPage = newPage;
            currentY = newPage.getSize().height - 50;
            console.log('📄 New page added, new yPosition:', currentY);
          }
          
          safeDrawText(currentPage, line, { x, y: currentY, size: fontSize, font: getFontFor(line, isBold) });
          line = word + ' ';
          currentY -= fontSize + 5;
        } else {
          line = testLine;
        }
      }
      
      if (line) {
        // Check if we need a new page before drawing the final line
        if (currentY < 100) {
          console.log('📄 Adding new page for final line, currentY was:', currentY);
          const newPage = pdfDoc.addPage([595.28, 841.89]);
          currentPage = newPage;
          currentY = newPage.getSize().height - 50;
          console.log('📄 New page added for final line, new yPosition:', currentY);
        }
        safeDrawText(currentPage, line, { x, y: currentY, size: fontSize, font: getFontFor(line, isBold) });
      }
      
      return currentY - fontSize - 5;
    };

    // Header
    safeDrawText(page, 'Health Report Summary', { 
      x: 50, 
      y: yPosition, 
      size: 20, 
      font: getFontFor('Health Report Summary', true),
      color: rgb(0.2, 0.2, 0.2)
    });
    yPosition -= 40;

    // Add image if this is an image analysis report
    if (healthReport.analysis_type === 'image' && healthReport.image_data) {
      try {
        // Embed the image
        const imageBytes = Buffer.from(healthReport.image_data, 'base64');
        let image;
        
        if (healthReport.image_mime_type === 'image/png') {
          image = await pdfDoc.embedPng(imageBytes);
        } else if (healthReport.image_mime_type === 'image/jpeg' || healthReport.image_mime_type === 'image/jpg') {
          image = await pdfDoc.embedJpg(imageBytes);
        } else {
          // Try to embed as PNG by default
          image = await pdfDoc.embedPng(imageBytes);
        }
        
        // Calculate image dimensions (max width 300px, maintain aspect ratio)
        const maxWidth = 300;
        const maxHeight = 200;
        const imageDims = image.scale(1);
        const scale = Math.min(maxWidth / imageDims.width, maxHeight / imageDims.height);
        const scaledWidth = imageDims.width * scale;
        const scaledHeight = imageDims.height * scale;
        
        // Add image title
        yPosition = addText('ANALYZED IMAGE', 50, yPosition, width - 100, 16, true);
        yPosition -= 10;
        
        // Draw the image
        page.drawImage(image, {
          x: 50,
          y: yPosition - scaledHeight,
          width: scaledWidth,
          height: scaledHeight,
        });
        
        yPosition -= scaledHeight + 20;
        
        // Add image filename if available
        if (healthReport.image_filename) {
          yPosition = addText(`Image: ${healthReport.image_filename}`, 50, yPosition, width - 100, 10);
          yPosition -= 15;
        }
      } catch (imageError) {
        console.error('Error embedding image in PDF:', imageError);
        // Continue without image if there's an error
        yPosition = addText('Image could not be included in PDF', 50, yPosition, width - 100, 12);
        yPosition -= 20;
      }
    }

    // Report details
    yPosition = addText(`Report Title: ${healthReport.title || 'N/A'}`, 50, yPosition, width - 100, 14, true);
    yPosition = addText(`Report Type: ${healthReport.report_type || 'N/A'}`, 50, yPosition, width - 100, 12);
    yPosition = addText(`Date: ${healthReport.created_at ? new Date(healthReport.created_at).toLocaleDateString() : 'N/A'}`, 50, yPosition, width - 100, 12);
    yPosition = addText(`Risk Level: ${(healthReport.risk_level || 'normal').toUpperCase()}`, 50, yPosition, width - 100, 12, true);
    yPosition -= 20;

    // Summary
    if (finalSummary) {
      yPosition = addText('SUMMARY', 50, yPosition, width - 100, 16, true);
      yPosition -= 10;
      yPosition = addText(finalSummary, 50, yPosition, width - 100, 12, false, true);
      yPosition -= 20;
    }

    // Key Findings
    if (healthReport.key_findings && healthReport.key_findings.length > 0) {
      yPosition = addText('KEY FINDINGS', 50, yPosition, width - 100, 16, true);
      yPosition -= 10;
      
      for (const finding of healthReport.key_findings) {
        if (finding && typeof finding === 'string') {
          yPosition = addText(`• ${finding}`, 60, yPosition, width - 120, 12, false, true);
        }
      }
      yPosition -= 20;
    }

    // Recommendations
    if (healthReport.recommendations && healthReport.recommendations.length > 0) {
      yPosition = addText('RECOMMENDATIONS', 50, yPosition, width - 100, 16, true);
      yPosition -= 10;
      
      for (const recommendation of healthReport.recommendations) {
        if (recommendation && typeof recommendation === 'string') {
          yPosition = addText(`• ${recommendation}`, 60, yPosition, width - 120, 12, false, true);
        }
      }
      yPosition -= 20;
    }

    // Full Analysis
    if (finalAnalysis) {
      console.log('📄 Adding detailed analysis to PDF, length:', finalAnalysis.length);
      yPosition = addText('DETAILED ANALYSIS', 50, yPosition, width - 100, 16, true);
      yPosition -= 10;
      yPosition = addText(finalAnalysis, 50, yPosition, width - 100, 11, false, true);
      console.log('📄 Detailed analysis added, final yPosition:', yPosition);
    }

    // Footer
    const lastPage = pdfDoc.getPages()[pdfDoc.getPages().length - 1];
    safeDrawText(lastPage, 'Generated by HealthConsultant AI', { 
      x: 50, 
      y: 30, 
      size: 10, 
      font: getFontFor('Generated by HealthConsultant AI', false),
      color: rgb(0.5, 0.5, 0.5)
    });

    const pdfBytes = await pdfDoc.save();
    // Convert to ArrayBuffer for Response on the server
    const ab = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength);

    // Add history entry
    await supabase
      .from('health_report_history')
      .insert({
        health_report_id: healthReport.id,
        user_id: user.id,
        action: 'pdf_created',
        details: { filename: `${healthReport.title}_summary.pdf` }
      });

    return new NextResponse(ab as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${healthReport.title}_summary.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}

// Helper functions for duplicate detection and summary regeneration
function checkIfSummaryIsDuplicate(summary: string | null, analysis: string | null): boolean {
  if (!summary || !analysis) return false;
  
  const cleanSummary = summary.replace(/\s+/g, ' ').trim().toLowerCase();
  const cleanAnalysis = analysis.replace(/\s+/g, ' ').trim().toLowerCase();
  
  // Check if summary is just a truncated version of analysis
  const summaryWords = cleanSummary.split(' ').filter(w => w.length > 3);
  const analysisStart = cleanAnalysis.substring(0, cleanSummary.length * 1.5);
  const analysisWords = analysisStart.split(' ').filter(w => w.length > 3);
  
  // If more than 70% of summary words are in the analysis start, it's likely duplicate
  const matchingWords = summaryWords.filter(word => analysisWords.includes(word));
  const overlapRatio = summaryWords.length > 0 ? matchingWords.length / summaryWords.length : 0;
  
  const isDuplicate = overlapRatio > 0.7;
  console.log('🔍 Duplicate check details:', {
    summaryLength: cleanSummary.length,
    analysisLength: cleanAnalysis.length,
    overlapRatio: overlapRatio.toFixed(2),
    isDuplicate
  });
  
  return isDuplicate;
}

async function regenerateSummary(analysis: string): Promise<string | null> {
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

    const prompt = `Create a patient-friendly summary that is COMPLETELY DIFFERENT from this medical analysis.

CRITICAL REQUIREMENTS:
- Write 3-4 sentences in simple language
- Focus on what the patient should know and do
- Use different words and phrases than the analysis
- No medical jargon or technical descriptions
- No markdown symbols (**, ###, *, etc.)
- Support multiple languages

Medical Analysis:
${analysis}

Patient Summary:`;

    const result = await model.generateContent(prompt);
    const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return text
      .replace(/[\*#`_~]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  } catch (error) {
    console.error('Error regenerating summary:', error);
    return null;
  }
}
