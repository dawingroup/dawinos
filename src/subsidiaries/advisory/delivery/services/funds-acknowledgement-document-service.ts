/**
 * FUNDS ACKNOWLEDGEMENT DOCUMENT SERVICE
 *
 * Generates Funds Received Acknowledgement PDFs with:
 * - Dual logos (client + donor)
 * - Facility branding header
 * - Transaction details table
 * - Acknowledgement statement
 * - Signature block (with digital signature support)
 */

import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import {
  FundsAcknowledgementFormData,
  FundsAcknowledgementPDFOptions,
  FacilityBranding,
  generateAcknowledgementFileName,
} from '../types/funds-acknowledgement';

// ─────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────

/**
 * Format currency for display
 */
function formatCurrency(amount: number, currency: string = 'UGX'): string {
  return new Intl.NumberFormat('en-UG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date for display
 */
function formatDate(date: Date | any): string {
  const d = date instanceof Date ? date : date?.toDate?.() || new Date(date);
  return format(d, 'MMMM d, yyyy');
}

/**
 * Format date with ordinal suffix (e.g., "3rd September 2025")
 */
function formatDateWithOrdinal(date: Date | any): string {
  const d = date instanceof Date ? date : date?.toDate?.() || new Date(date);
  const day = d.getDate();

  const ordinal = (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return `${ordinal(day)} ${format(d, 'MMMM yyyy')}`;
}

/**
 * Convert number to words (for amounts)
 */
function numberToWords(num: number): string {
  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  const convertHundreds = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convertHundreds(n % 100) : '');
  };

  const convertThousands = (n: number): string => {
    if (n < 1000) return convertHundreds(n);
    if (n < 1000000) {
      return (
        convertHundreds(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convertHundreds(n % 1000) : '')
      );
    }
    if (n < 1000000000) {
      return (
        convertHundreds(Math.floor(n / 1000000)) +
        ' Million' +
        (n % 1000000 ? ' ' + convertThousands(n % 1000000) : '')
      );
    }
    return (
      convertHundreds(Math.floor(n / 1000000000)) +
      ' Billion' +
      (n % 1000000000 ? ' ' + convertThousands(n % 1000000000) : '')
    );
  };

  return convertThousands(Math.floor(num)) + ' Shillings Only';
}

// ─────────────────────────────────────────────────────────────────
// IMAGE LOADING
// ─────────────────────────────────────────────────────────────────

/**
 * Load image from URL as base64 data URL
 */
async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to load image:', url, error);
    return null;
  }
}

/**
 * Get image dimensions from base64 data URL
 */
async function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve({ width: 100, height: 100 }); // Default fallback
    img.src = dataUrl;
  });
}

// ─────────────────────────────────────────────────────────────────
// PDF GENERATION
// ─────────────────────────────────────────────────────────────────

/**
 * Generate Funds Acknowledgement PDF
 */
export async function generateFundsAcknowledgementPDF(
  options: FundsAcknowledgementPDFOptions
): Promise<jsPDF> {
  const { formData, branding, projectCode } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const marginLR = 25.4; // 1 inch left/right margins
  const marginTB = 18; // 18mm top/bottom margins
  const contentWidth = pageWidth - marginLR * 2;
  let yPos = marginTB;

  // ─────────────────────────────────────────────────────────────────
  // HEADER WITH DUAL LOGOS AND CENTERED FACILITY BRANDING
  // Layout: [Logo Left 15%] [Padding] [Facility Info Center] [Padding] [Logo Right 15%]
  // All elements TOP-ALIGNED horizontally
  // ─────────────────────────────────────────────────────────────────

  // Header configuration
  const logoFixedHeight = 30; // mm - height for facility logo (increased size)
  const logoMaxWidth = 55; // mm - max width limit to prevent overlap with center text

  // Calculate positions
  const logoLeftX = marginLR;
  const centerX = pageWidth / 2;

  // TOP alignment - logos and text start at same Y position
  const headerTopY = yPos + 2; // Small top padding

  // Client logo (left) - FIXED HEIGHT, variable width preserving aspect ratio
  if (branding.clientLogoUrl) {
    try {
      const clientLogoBase64 = await loadImageAsBase64(branding.clientLogoUrl);
      if (clientLogoBase64) {
        const dims = await getImageDimensions(clientLogoBase64);
        const aspectRatio = dims.width / dims.height;

        // Set height to fixed value, calculate width from aspect ratio
        let logoHeight = logoFixedHeight;
        let logoWidth = logoHeight * aspectRatio;

        // Cap width to prevent overlap with center text
        if (logoWidth > logoMaxWidth) {
          logoWidth = logoMaxWidth;
          logoHeight = logoWidth / aspectRatio;
        }

        // Top-align logo in header row
        const logoY = headerTopY;

        doc.addImage(clientLogoBase64, 'PNG', logoLeftX, logoY, logoWidth, logoHeight);
      }
    } catch (error) {
      console.error('Failed to add client logo:', error);
    }
  }

  // Facility branding text (shifted slightly right since logo is on left)
  // For baseline alignment: 14pt font has ~3.5mm cap height, so offset by that amount
  // to make the top of the text align with the top of the logo
  const textStartY = headerTopY + 3.5; // Offset for font baseline (14pt cap height)
  const textCenterX = centerX + 10; // Shifted 10mm right to balance with logo on left

  // Facility name (centered, bold, uppercase, larger font)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(branding.facilityName.toUpperCase(), textCenterX, textStartY, { align: 'center' });

  // Address
  let textY = textStartY + 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (branding.address) {
    doc.text(branding.address, textCenterX, textY, { align: 'center' });
    textY += 4;
  }

  // Contact (Tel, Email)
  if (branding.telephone || branding.email) {
    const contactParts: string[] = [];
    if (branding.telephone) contactParts.push(`Tel: ${branding.telephone}`);
    if (branding.email) contactParts.push(`Email: ${branding.email}`);
    doc.text(contactParts.join(' | '), textCenterX, textY, { align: 'center' });
    textY += 4;
  }

  // Tagline (italic) - grouped with header section above the separator
  if (branding.tagline) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`"${branding.tagline}"`, textCenterX, textY, { align: 'center' });
    textY += 4;
  }

  // Position content based on actual header height
  // Use whichever is taller: logo or text content
  const logoEndY = headerTopY + logoFixedHeight;
  const textEndY = textY;
  yPos = Math.max(logoEndY, textEndY) + 8; // Padding after header before title

  // ─────────────────────────────────────────────────────────────────
  // DOCUMENT TITLE
  // ─────────────────────────────────────────────────────────────────

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Funds Received Acknowledgement Form', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // ─────────────────────────────────────────────────────────────────
  // TRANSACTION DETAILS TABLE
  // ─────────────────────────────────────────────────────────────────

  const tableStartY = yPos;
  const col1Width = 55;
  const col2Width = contentWidth - col1Width;
  const rowHeight = 11; // Increased row height for larger font

  doc.setFontSize(12); // Increased font size

  const tableRows = [
    ['Receipt Number:', formData.receiptNumber || 'TBD'],
    ['Date of Funds Transfer:', formatDateWithOrdinal(formData.dateOfFundsTransfer)],
    ['Project Name:', formData.projectName],
    ['Amount Received:', formatCurrency(formData.amountReceived, formData.currency)],
    ['Amount in Words:', numberToWords(formData.amountReceived)],
    ['Method of Payment:', formData.paymentMethod],
  ];

  tableRows.forEach((row, index) => {
    const rowY = tableStartY + index * rowHeight;

    // Left column (label) - dark background
    doc.setFillColor(44, 62, 80); // Dark blue-gray
    doc.rect(marginLR, rowY, col1Width, rowHeight, 'F');

    // Right column (value) - light background
    if (index % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(249, 249, 249);
    }
    doc.rect(marginLR + col1Width, rowY, col2Width, rowHeight, 'F');

    // Label text (white on dark)
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(row[0], marginLR + 4, rowY + 7);

    // Value text (black on light)
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);

    // Handle long text wrapping
    const valueLines = doc.splitTextToSize(row[1], col2Width - 8);
    doc.text(valueLines[0] || '', marginLR + col1Width + 4, rowY + 7);
  });

  yPos = tableStartY + tableRows.length * rowHeight;

  // Table border
  doc.setDrawColor(200, 200, 200);
  doc.rect(marginLR, tableStartY, contentWidth, yPos - tableStartY);
  doc.line(marginLR + col1Width, tableStartY, marginLR + col1Width, yPos);

  yPos += 15;

  // ─────────────────────────────────────────────────────────────────
  // ACKNOWLEDGEMENT STATEMENT (Justified text)
  // ─────────────────────────────────────────────────────────────────

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);

  const projectDesc = formData.projectDescription || formData.projectName;
  const period = formData.periodCovered || format(formData.dateOfFundsTransfer, 'MMMM yyyy');

  // Build full statement
  const fullStatement = `I, ${formData.requestorName}, the undersigned, hereby acknowledge that I have received the funds as ${projectDesc} for the month of ${period}.`;

  // Split into lines that fit the content width
  doc.setFont('helvetica', 'normal');
  const statementLines = doc.splitTextToSize(fullStatement, contentWidth);
  const lineHeight = 6;

  // Draw each line with justified alignment (except last line)
  statementLines.forEach((line: string, index: number) => {
    const isLastLine = index === statementLines.length - 1;

    if (isLastLine) {
      // Last line: left-aligned
      doc.text(line, marginLR, yPos);
    } else {
      // Other lines: justified by spacing words evenly
      const words = line.split(' ');
      if (words.length > 1) {
        const totalWordsWidth = words.reduce((acc, word) => acc + doc.getTextWidth(word), 0);
        const spaceWidth = (contentWidth - totalWordsWidth) / (words.length - 1);

        let xPos = marginLR;
        words.forEach((word, wordIndex) => {
          // Check if this is the requestor name and make it bold
          if (word === formData.requestorName || line.includes(`I, ${formData.requestorName},`) && word === formData.requestorName.split(' ')[0]) {
            doc.setFont('helvetica', 'bold');
          }
          doc.text(word, xPos, yPos);
          doc.setFont('helvetica', 'normal');
          xPos += doc.getTextWidth(word) + (wordIndex < words.length - 1 ? spaceWidth : 0);
        });
      } else {
        doc.text(line, marginLR, yPos);
      }
    }
    yPos += lineHeight;
  });

  yPos += 14; // Space after statement before signature

  // ─────────────────────────────────────────────────────────────────
  // SIGNATURE BLOCK
  // ─────────────────────────────────────────────────────────────────

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Requestor Signature:', marginLR, yPos);
  yPos += 8;

  // If digital signature provided, embed it (left-aligned, larger size)
  if (formData.signatureDataUrl) {
    try {
      const signatureWidth = 80;
      const signatureHeight = 35;
      doc.addImage(formData.signatureDataUrl, 'PNG', marginLR, yPos, signatureWidth, signatureHeight);
      yPos += signatureHeight + 3;
    } catch (error) {
      console.error('Failed to add signature:', error);
      // Leave space for manual signature (no line)
      yPos += 20;
    }
  } else {
    // Leave space for manual signature (no line)
    yPos += 20;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  yPos += 8;

  // Date field - text only, no line
  if (formData.signatureDate) {
    doc.text(formatDate(formData.signatureDate), marginLR, yPos);
  }
  yPos += 8;

  // Title field - text only, no line
  if (formData.requestorTitle) {
    doc.text(formData.requestorTitle, marginLR, yPos);
  }

  // ─────────────────────────────────────────────────────────────────
  // FOOTER
  // ─────────────────────────────────────────────────────────────────

  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Ref: ${projectCode}/${formData.receiptNumber || 'DRAFT'}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  return doc;
}

// ─────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────

/**
 * Generate and download Funds Acknowledgement PDF
 */
export async function downloadFundsAcknowledgementPDF(options: FundsAcknowledgementPDFOptions): Promise<void> {
  const doc = await generateFundsAcknowledgementPDF(options);
  const filename = generateAcknowledgementFileName(options.projectCode, options.formData.periodCovered);
  doc.save(filename);
}

/**
 * Generate Funds Acknowledgement PDF as Blob (for upload to storage)
 */
export async function generateFundsAcknowledgementBlob(options: FundsAcknowledgementPDFOptions): Promise<Blob> {
  const doc = await generateFundsAcknowledgementPDF(options);
  return doc.output('blob');
}

/**
 * Generate Funds Acknowledgement PDF as data URL (for preview)
 */
export async function generateFundsAcknowledgementDataUrl(
  options: FundsAcknowledgementPDFOptions
): Promise<string> {
  const doc = await generateFundsAcknowledgementPDF(options);
  return doc.output('datauristring');
}

/**
 * Export helper functions for use elsewhere
 */
export { formatCurrency, formatDate, numberToWords, formatDateWithOrdinal };
