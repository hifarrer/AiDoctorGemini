import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { PDFDocument, rgb, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

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

    // Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size

    // Enable embedding of Unicode fonts
    pdfDoc.registerFontkit(fontkit);

    // Load Unicode-capable fonts (Latin + Cyrillic) and CJK font for Chinese
    const NOTO_SANS_URL = 'https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf';
    const NOTO_SANS_BOLD_URL = 'https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Bold.ttf';
    const NOTO_CJK_SC_URL = 'https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf';
    const NOTO_CJK_SC_BOLD_URL = 'https://github.com/googlefonts/noto-cjk/raw/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Bold.otf';

    const loadFontBytes = async (url: string): Promise<Uint8Array> => {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch font at ${url}`);
      }
      const buf = await res.arrayBuffer();
      return new Uint8Array(buf);
    };

    const [notoSansBytes, notoSansBoldBytes, cjkBytes, cjkBoldBytes] = await Promise.all([
      loadFontBytes(NOTO_SANS_URL),
      loadFontBytes(NOTO_SANS_BOLD_URL),
      loadFontBytes(NOTO_CJK_SC_URL),
      loadFontBytes(NOTO_CJK_SC_BOLD_URL),
    ]);

    const unicodeFont: PDFFont = await pdfDoc.embedFont(notoSansBytes, { subset: false });
    const unicodeBoldFont: PDFFont = await pdfDoc.embedFont(notoSansBoldBytes, { subset: false });
    const cjkFont: PDFFont = await pdfDoc.embedFont(cjkBytes, { subset: false });
    const cjkBoldFont: PDFFont = await pdfDoc.embedFont(cjkBoldBytes, { subset: false });

    // Base Latin/Cyrillic fonts; we will dynamically switch to CJK when needed
    let font: PDFFont = unicodeFont;
    let boldFont: PDFFont = unicodeBoldFont;

    // Avoid the 'u' flag for environments targeting < ES6
    const containsCJK = (text: string): boolean => /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/.test(text);
    const getFontFor = (text: string, isBold: boolean): PDFFont =>
      containsCJK(text) ? (isBold ? cjkBoldFont : cjkFont) : (isBold ? boldFont : font);

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
      const fontToUse = isBold ? boldFont : font;
      
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
    if (healthReport.ai_summary) {
      yPosition = addText('SUMMARY', 50, yPosition, width - 100, 16, true);
      yPosition -= 10;
      yPosition = addText(healthReport.ai_summary, 50, yPosition, width - 100, 12, false, true);
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
    if (healthReport.ai_analysis) {
      console.log('📄 Adding detailed analysis to PDF, length:', healthReport.ai_analysis.length);
      yPosition = addText('DETAILED ANALYSIS', 50, yPosition, width - 100, 16, true);
      yPosition -= 10;
      yPosition = addText(healthReport.ai_analysis, 50, yPosition, width - 100, 11, false, true);
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

    // Add history entry
    await supabase
      .from('health_report_history')
      .insert({
        health_report_id: healthReport.id,
        user_id: user.id,
        action: 'pdf_created',
        details: { filename: `${healthReport.title}_summary.pdf` }
      });

    return new NextResponse(pdfBytes, {
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
