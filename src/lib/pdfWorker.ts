import * as pdfjsLib from 'pdfjs-dist';

// Set up the PDF.js worker
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  // Use matching version CDN worker to prevent Vite worker bundling / MIME type issues
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export { pdfjsLib };

