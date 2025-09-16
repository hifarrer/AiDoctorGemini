import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

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
    
    // Use TimesRoman which has better Unicode support than Helvetica
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const boldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    const { width, height } = page.getSize();
    let yPosition = height - 50;

    // Helper function to sanitize text for PDF (supports Unicode including Cyrillic, Arabic, Chinese, etc.)
    const sanitizeText = (text: string): string => {
      if (!text) return '';
      return text
        .replace(/[\r\n\t]/g, ' ') // Replace newlines, carriage returns, and tabs with spaces
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove only control characters, keep all Unicode
        .trim();
    };

    // Helper function to safely draw text with Unicode support
    const safeDrawText = (page: any, text: string, options: any) => {
      try {
        // Try to draw the text as-is first
        page.drawText(text, options);
      } catch (error) {
        console.warn('Unicode character rendering issue, attempting fallback:', error);
        // Fallback: replace problematic characters with placeholders
        // Support major Unicode blocks: Basic Latin, Cyrillic, Arabic, Chinese, etc.
        const fallbackText = text
          .replace(/[^\x20-\x7E\u0400-\u04FF\u0500-\u052F\u2DE0-\u2DFF\uA640-\uA69F\u0600-\u06FF\u4E00-\u9FFF\u3400-\u4DBF\u20000-\u2A6DF\u2A700-\u2B73F\u2B740-\u2B81F\u2B820-\u2CEAF\uF900-\uFAFF\u2F800-\u2FA1F]/g, '?')
          .replace(/\s+/g, ' ');
        try {
          page.drawText(fallbackText, options);
        } catch (fallbackError) {
          console.error('Fallback text rendering also failed:', fallbackError);
          // Last resort: draw a placeholder
          page.drawText('[Text contains unsupported characters]', options);
        }
      }
    };

    // Helper function to add text with word wrapping and page breaks
    const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 12, isBold: boolean = false) => {
      const fontToUse = isBold ? boldFont : font;
      const sanitizedText = sanitizeText(text);
      const words = sanitizedText.split(' ');
      let line = '';
      let currentY = y;
      let currentPage = page;

      for (const word of words) {
        const testLine = line + word + ' ';
        const textWidth = fontToUse.widthOfTextAtSize(testLine, fontSize);
        
        if (textWidth > maxWidth && line !== '') {
          // Check if we need a new page before drawing the line
          if (currentY < 100) {
            console.log('📄 Adding new page, currentY was:', currentY);
            const newPage = pdfDoc.addPage([595.28, 841.89]);
            currentPage = newPage;
            currentY = newPage.getSize().height - 50;
            console.log('📄 New page added, new yPosition:', currentY);
          }
          
          safeDrawText(currentPage, line, { x, y: currentY, size: fontSize, font: fontToUse });
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
        safeDrawText(currentPage, line, { x, y: currentY, size: fontSize, font: fontToUse });
      }
      
      return currentY - fontSize - 5;
    };

    // Header
    safeDrawText(page, 'Health Report Summary', { 
      x: 50, 
      y: yPosition, 
      size: 20, 
      font: boldFont,
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
      yPosition = addText(healthReport.ai_summary, 50, yPosition, width - 100, 12);
      yPosition -= 20;
    }

    // Key Findings
    if (healthReport.key_findings && healthReport.key_findings.length > 0) {
      yPosition = addText('KEY FINDINGS', 50, yPosition, width - 100, 16, true);
      yPosition -= 10;
      
      for (const finding of healthReport.key_findings) {
        if (finding && typeof finding === 'string') {
          yPosition = addText(`• ${finding}`, 60, yPosition, width - 120, 12);
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
          yPosition = addText(`• ${recommendation}`, 60, yPosition, width - 120, 12);
        }
      }
      yPosition -= 20;
    }

    // Full Analysis
    if (healthReport.ai_analysis) {
      console.log('📄 Adding detailed analysis to PDF, length:', healthReport.ai_analysis.length);
      yPosition = addText('DETAILED ANALYSIS', 50, yPosition, width - 100, 16, true);
      yPosition -= 10;
      yPosition = addText(healthReport.ai_analysis, 50, yPosition, width - 100, 11);
      console.log('📄 Detailed analysis added, final yPosition:', yPosition);
    }

    // Footer
    const lastPage = pdfDoc.getPages()[pdfDoc.getPages().length - 1];
    safeDrawText(lastPage, 'Generated by HealthConsultant AI', { 
      x: 50, 
      y: 30, 
      size: 10, 
      font: font,
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
