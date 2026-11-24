import { pdfjsLib } from './pdfWorker';

export interface PDFInfo {
  pageCount: number;
  thumbnailUrl: string;
}

export async function extractPDFInfo(file: File): Promise<PDFInfo> {
  if (!file || file.size === 0) {
    throw new Error('File is empty (0 bytes)');
  }

  const arrayBuffer = await file.arrayBuffer();
  if (arrayBuffer.byteLength === 0) {
    throw new Error('File has 0 bytes');
  }

  // Scan for %PDF- header to handle files with leading BOM or whitespace
  const bytes = new Uint8Array(arrayBuffer);
  const pdfHeader = [0x25, 0x50, 0x44, 0x46, 0x2d]; // '%PDF-'
  let cleanBuffer: ArrayBuffer = arrayBuffer.slice(0);

  const searchLimit = Math.min(bytes.length - 4, 2048);
  for (let i = 0; i < searchLimit; i++) {
    if (
      bytes[i] === pdfHeader[0] &&
      bytes[i + 1] === pdfHeader[1] &&
      bytes[i + 2] === pdfHeader[2] &&
      bytes[i + 3] === pdfHeader[3] &&
      bytes[i + 4] === pdfHeader[4]
    ) {
      if (i > 0) {
        cleanBuffer = arrayBuffer.slice(i);
      }
      break;
    }
  }

  const loadingTask = pdfjsLib.getDocument({ data: cleanBuffer });
  const pdfDoc = await loadingTask.promise;
  const pageCount = pdfDoc.numPages;

  // Render page 1 for thumbnail
  const page = await pdfDoc.getPage(1);
  const unscaledViewport = page.getViewport({ scale: 1 });

  // Target thumbnail width around 240px
  const targetWidth = 240;
  const scale = targetWidth / unscaledViewport.width;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  if (!context) {
    throw new Error('Canvas 2D context not available');
  }

  // White background for transparent PDFs
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  await page.render(renderContext).promise;

  const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.85);

  return {
    pageCount,
    thumbnailUrl,
  };
}
