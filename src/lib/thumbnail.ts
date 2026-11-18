import { pdfjsLib } from './pdfWorker';

export interface PDFInfo {
  pageCount: number;
  thumbnailUrl: string;
}

export async function extractPDFInfo(file: File): Promise<PDFInfo> {
  const arrayBuffer = await file.arrayBuffer();
  // Copy buffer to prevent detachment issues
  const bufferCopy = arrayBuffer.slice(0);
  
  const loadingTask = pdfjsLib.getDocument({ data: bufferCopy });
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

