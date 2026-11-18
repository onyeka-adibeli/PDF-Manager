import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import mammoth from 'mammoth';
import html2canvas from 'html2canvas';
import { ConvertFileItem, ConvertOptions } from '../types';

// Standard paper dimensions in points (72 points per inch)
const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
};

/**
 * Detect file type category
 */
export function detectConvertibleType(file: File): 'image' | 'docx' | 'text' {
  const ext = file.name.slice(((file.name.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();

  if (file.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'svg'].includes(ext)) {
    return 'image';
  }
  if (['docx', 'doc'].includes(ext) || file.type.includes('wordprocessingml') || file.type.includes('msword')) {
    return 'docx';
  }
  return 'text';
}

/**
 * Converts any browser-supported image into a page in a PDFDocument.
 */
export async function convertImageToPdfPage(
  file: File,
  doc: PDFDocument,
  options?: Partial<ConvertOptions>
): Promise<void> {
  const imgUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = (e) => reject(new Error('Failed to load image for conversion'));
      element.src = imgUrl;
    });

    const naturalWidth = img.naturalWidth || img.width;
    const naturalHeight = img.naturalHeight || img.height;

    // Convert image to JPEG/PNG via offscreen canvas for universal compatibility
    const canvas = document.createElement('canvas');
    canvas.width = naturalWidth;
    canvas.height = naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas context');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, naturalWidth, naturalHeight);
    ctx.drawImage(img, 0, 0);

    const quality = options?.imageQuality ?? 0.9;
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    const embeddedImg = await doc.embedJpg(dataUrl);

    // Determine target page size & orientation
    const pageSizeOpt = options?.pageSize || 'a4';
    let targetPageWidth: number;
    let targetPageHeight: number;

    if (pageSizeOpt === 'auto') {
      targetPageWidth = naturalWidth;
      targetPageHeight = naturalHeight;
    } else {
      const standard = PAGE_SIZES[pageSizeOpt] || PAGE_SIZES.a4;
      const isLandscape =
        options?.orientation === 'landscape' ||
        (options?.orientation === 'auto' && naturalWidth > naturalHeight);

      targetPageWidth = isLandscape ? standard.height : standard.width;
      targetPageHeight = isLandscape ? standard.width : standard.height;
    }

    // Determine margin
    let margin = 0;
    if (options?.margin === 'small') margin = 18;
    else if (options?.margin === 'normal') margin = 36;
    else if (pageSizeOpt === 'auto') margin = 0;

    const availableWidth = targetPageWidth - margin * 2;
    const availableHeight = targetPageHeight - margin * 2;

    // Scale image while preserving aspect ratio
    const scale = Math.min(availableWidth / naturalWidth, availableHeight / naturalHeight, 1);
    const renderWidth = naturalWidth * scale;
    const renderHeight = naturalHeight * scale;

    const x = margin + (availableWidth - renderWidth) / 2;
    const y = margin + (availableHeight - renderHeight) / 2;

    const page = doc.addPage([targetPageWidth, targetPageHeight]);
    page.drawImage(embeddedImg, {
      x,
      y,
      width: renderWidth,
      height: renderHeight,
    });
  } finally {
    URL.revokeObjectURL(imgUrl);
  }
}

/**
 * Converts a DOC / DOCX document to PDF pages.
 */
export async function convertDocxToPdf(
  file: File,
  doc: PDFDocument,
  onProgress?: (percent: number, stepText: string) => void
): Promise<void> {
  onProgress?.(20, 'Parsing DOCX structure & text...');
  const arrayBuffer = await file.arrayBuffer();

  let htmlContent = '';
  try {
    const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer.slice(0) });
    htmlContent = result.value;
  } catch (err) {
    // Fallback: try raw text extraction
    try {
      const textResult = await mammoth.extractRawText({ arrayBuffer: arrayBuffer.slice(0) });
      htmlContent = `<pre style="white-space: pre-wrap; font-family: sans-serif;">${textResult.value}</pre>`;
    } catch {
      throw new Error('Unable to parse DOCX file structure.');
    }
  }

  onProgress?.(50, 'Rendering document layout...');

  // Create an offscreen DOM element styled as a professional document
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px'; // ~A4 width at 96 DPI
  container.style.padding = '48px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#1e293b';
  container.style.fontFamily = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  container.style.fontSize = '14px';
  container.style.lineHeight = '1.6';

  // Inject sanitized HTML with clean typography styling
  container.innerHTML = `
    <style>
      h1 { font-size: 24px; font-weight: bold; margin-bottom: 16px; color: #0f172a; }
      h2 { font-size: 20px; font-weight: bold; margin-top: 20px; margin-bottom: 12px; color: #1e293b; }
      h3 { font-size: 16px; font-weight: bold; margin-top: 16px; margin-bottom: 8px; color: #334155; }
      p { margin-bottom: 12px; }
      ul, ol { margin-left: 24px; margin-bottom: 12px; }
      li { margin-bottom: 4px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px; }
      th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
      th { background-color: #f1f5f9; font-weight: 600; }
      img { max-width: 100%; height: auto; margin: 12px 0; }
      blockquote { border-left: 4px solid #94a3b8; padding-left: 16px; margin: 12px 0; color: #475569; }
    </style>
    <div>${htmlContent || '<p>Empty Document</p>'}</div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 1.5,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    onProgress?.(80, 'Generating PDF pages...');

    // Paginate canvas into A4 height slices
    const a4Width = PAGE_SIZES.a4.width;
    const a4Height = PAGE_SIZES.a4.height;
    const pxPerA4Height = (canvas.width / a4Width) * a4Height;

    const totalPages = Math.max(1, Math.ceil(canvas.height / pxPerA4Height));

    for (let p = 0; p < totalPages; p++) {
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      const sliceHeight = Math.min(pxPerA4Height, canvas.height - p * pxPerA4Height);
      sliceCanvas.height = sliceHeight;

      const sliceCtx = sliceCanvas.getContext('2d');
      if (sliceCtx) {
        sliceCtx.fillStyle = '#ffffff';
        sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        sliceCtx.drawImage(
          canvas,
          0,
          p * pxPerA4Height,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );

        const pageImgData = sliceCanvas.toDataURL('image/jpeg', 0.9);
        const embedded = await doc.embedJpg(pageImgData);

        const page = doc.addPage([a4Width, a4Height]);
        const renderedHeight = (sliceHeight / canvas.width) * a4Width;

        page.drawImage(embedded, {
          x: 0,
          y: a4Height - renderedHeight,
          width: a4Width,
          height: renderedHeight,
        });
      }
    }
  } finally {
    document.body.removeChild(container);
  }
}

/**
 * Converts plain text, markdown, or code file to PDF pages.
 */
export async function convertTextToPdf(
  file: File,
  doc: PDFDocument,
  onProgress?: (percent: number, stepText: string) => void
): Promise<void> {
  onProgress?.(20, 'Reading text content...');
  const text = await file.text();

  onProgress?.(50, 'Formatting text layout...');
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const a4Width = PAGE_SIZES.a4.width;
  const a4Height = PAGE_SIZES.a4.height;
  const margin = 48;
  const contentWidth = a4Width - margin * 2;
  const fontSize = 11;
  const lineHeight = 16;
  const linesPerPage = Math.floor((a4Height - margin * 2 - 40) / lineHeight);

  // Split text into wrapped lines
  const rawLines = text.split(/\r?\n/);
  const formattedLines: string[] = [];

  for (const rawLine of rawLines) {
    if (rawLine.trim() === '') {
      formattedLines.push('');
      continue;
    }

    const words = rawLine.split(' ');
    let currentLine = '';

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(candidate, fontSize);

      if (width <= contentWidth) {
        currentLine = candidate;
      } else {
        formattedLines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) {
      formattedLines.push(currentLine);
    }
  }

  const totalPages = Math.max(1, Math.ceil(formattedLines.length / linesPerPage));

  for (let p = 0; p < totalPages; p++) {
    const page = doc.addPage([a4Width, a4Height]);
    let currentY = a4Height - margin;

    // Header on page 1
    if (p === 0) {
      page.drawText(file.name, {
        x: margin,
        y: currentY,
        size: 14,
        font: boldFont,
        color: rgb(0.1, 0.15, 0.2),
      });
      currentY -= 28;
    }

    // Render lines for this page
    const pageLines = formattedLines.slice(p * linesPerPage, (p + 1) * linesPerPage);
    for (const line of pageLines) {
      if (line) {
        page.drawText(line, {
          x: margin,
          y: currentY,
          size: fontSize,
          font: font,
          color: rgb(0.2, 0.25, 0.3),
        });
      }
      currentY -= lineHeight;
    }

    // Footer page number
    const footerText = `Page ${p + 1} of ${totalPages}`;
    const footerWidth = font.widthOfTextAtSize(footerText, 9);
    page.drawText(footerText, {
      x: (a4Width - footerWidth) / 2,
      y: 20,
      size: 9,
      font: font,
      color: rgb(0.5, 0.55, 0.6),
    });
  }
}

/**
 * Main conversion dispatcher for a single file or combined files.
 */
export async function convertSingleFile(
  item: ConvertFileItem,
  options: ConvertOptions,
  onProgress?: (percent: number, statusText: string) => void
): Promise<{ blob: Blob; url: string; size: number; durationMs: number }> {
  const startTime = performance.now();
  const doc = await PDFDocument.create();
  doc.setProducer('PDF Squeeze');
  doc.setCreator('PDF Squeeze');

  onProgress?.(10, `Converting ${item.name}...`);

  if (item.type === 'image') {
    await convertImageToPdfPage(item.file, doc, options);
  } else if (item.type === 'docx') {
    await convertDocxToPdf(item.file, doc, onProgress);
  } else {
    await convertTextToPdf(item.file, doc, onProgress);
  }

  onProgress?.(90, 'Finalizing PDF output...');
  const bytes = await doc.save({ useObjectStreams: true });
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const durationMs = Math.round(performance.now() - startTime);

  onProgress?.(100, 'Conversion completed!');

  return {
    blob,
    url,
    size: blob.size,
    durationMs,
  };
}

/**
 * Combines multiple files (e.g. photos or documents) into a single unified PDF.
 */
export async function convertMultipleFilesToOnePdf(
  items: ConvertFileItem[],
  options: ConvertOptions,
  onProgress?: (percent: number, statusText: string) => void
): Promise<{ blob: Blob; url: string; size: number; durationMs: number; pageCount: number }> {
  const startTime = performance.now();
  const doc = await PDFDocument.create();
  doc.setProducer('PDF Squeeze');
  doc.setCreator('PDF Squeeze');

  const total = items.length;

  for (let i = 0; i < total; i++) {
    const item = items[i];
    const progress = Math.round((i / total) * 85) + 10;
    onProgress?.(progress, `Processing (${i + 1}/${total}): ${item.name}...`);

    if (item.type === 'image') {
      await convertImageToPdfPage(item.file, doc, options);
    } else if (item.type === 'docx') {
      await convertDocxToPdf(item.file, doc);
    } else {
      await convertTextToPdf(item.file, doc);
    }
  }

  onProgress?.(95, 'Finalizing combined PDF...');
  const bytes = await doc.save({ useObjectStreams: true });
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const durationMs = Math.round(performance.now() - startTime);

  onProgress?.(100, 'Combined PDF ready!');

  return {
    blob,
    url,
    size: blob.size,
    durationMs,
    pageCount: doc.getPageCount(),
  };
}
