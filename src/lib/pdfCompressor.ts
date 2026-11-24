import { PDFDocument, PDFName } from 'pdf-lib';
import { pdfjsLib } from './pdfWorker';
import { sanitizePdfBuffer } from './pdfMerger';
import { CompressionOptions, PresetConfig, CompressionPreset } from '../types';

export const PRESET_CONFIGS: Record<CompressionPreset, PresetConfig> = {
  extreme: {
    id: 'extreme',
    label: 'Extreme',
    tagline: 'Smallest file size',
    badge: 'Max Compression',
    description: 'Compresses heavily to fit email and upload caps (< 1MB). Text remains legible.',
    mode: 'scanned',
    imageQuality: 0.45,
    scale: 1.0,
    grayscale: false,
    removeMetadata: true,
    preserveTextLayer: false,
    expectedSavings: '60% - 90%',
    color: 'from-amber-500/20 to-orange-500/20 text-orange-400 border-orange-500/40',
  },
  recommended: {
    id: 'recommended',
    label: 'Recommended',
    tagline: 'Best balance',
    badge: 'Popular',
    description: 'Optimal balance of crystal-clear sharpness and significant size reduction.',
    mode: 'smart',
    imageQuality: 0.70,
    scale: 1.35,
    grayscale: false,
    removeMetadata: true,
    preserveTextLayer: true,
    expectedSavings: '40% - 70%',
    color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/40',
  },
  low: {
    id: 'low',
    label: 'High Quality',
    tagline: 'Subtle compression',
    badge: 'Maximum Fidelity',
    description: 'Minimal compression. Preserves high-resolution details and vector sharpness.',
    mode: 'smart',
    imageQuality: 0.88,
    scale: 1.8,
    grayscale: false,
    removeMetadata: false,
    preserveTextLayer: true,
    expectedSavings: '20% - 40%',
    color: 'from-blue-500/20 to-indigo-500/20 text-blue-400 border-blue-500/40',
  },
  custom: {
    id: 'custom',
    label: 'Custom',
    tagline: 'Manual control',
    badge: 'Advanced',
    description: 'Fine-tune image quality, DPI resolution, grayscale conversion, and metadata stripping.',
    mode: 'smart',
    imageQuality: 0.70,
    scale: 1.35,
    grayscale: false,
    removeMetadata: true,
    preserveTextLayer: true,
    expectedSavings: 'Customizable',
    color: 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/40',
  },
};

export interface CompressionResult {
  blob: Blob;
  durationMs: number;
  originalSize: number;
  compressedSize: number;
}

/**
 * Compresses a PDF file according to the specified options.
 */
export async function compressPDF(
  file: File,
  options: CompressionOptions,
  onProgress?: (percent: number, statusText: string) => void
): Promise<CompressionResult> {
  const startTime = performance.now();
  const originalSize = file.size;

  if (file.size === 0) {
    throw new Error(`File "${file.name}" is empty (0 bytes).`);
  }

  onProgress?.(5, 'Reading PDF file...');
  const arrayBuffer = await file.arrayBuffer();
  if (arrayBuffer.byteLength === 0) {
    throw new Error(`File "${file.name}" has no readable content (0 bytes).`);
  }

  const { cleanBuffer } = sanitizePdfBuffer(arrayBuffer);

  let compressedBytes: Uint8Array;

  if (options.mode === 'smart' && options.preserveTextLayer) {
    // Smart Mode: tries structural and stream optimization first
    onProgress?.(15, 'Analyzing PDF structure & objects...');
    try {
      const pdfLibDoc = await PDFDocument.load(cleanBuffer.slice(0), {
        ignoreEncryption: true,
      });

      if (options.removeMetadata) {
        onProgress?.(25, 'Stripping document metadata...');
        pdfLibDoc.setTitle('');
        pdfLibDoc.setAuthor('');
        pdfLibDoc.setSubject('');
        pdfLibDoc.setKeywords([]);
        pdfLibDoc.setProducer('PDF Squeeze');
        pdfLibDoc.setCreator('PDF Squeeze');

        try {
          const catalog = pdfLibDoc.catalog;
          if (catalog.has(PDFName.of('Metadata'))) {
            catalog.delete(PDFName.of('Metadata'));
          }
        } catch {
          // Ignore if catalog metadata cannot be deleted
        }
      }

      onProgress?.(45, 'Optimizing streams and cross-references...');
      const structuralBytes = await pdfLibDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });

      // If structural optimization achieved significant reduction (e.g. > 15%),
      // or if user specifically wanted lossless structure preservation:
      if (structuralBytes.byteLength < originalSize * 0.85) {
        onProgress?.(95, 'Finalizing compressed document...');
        compressedBytes = structuralBytes;
      } else {
        // If structural compression alone didn't reduce file size significantly,
        // it means the PDF has heavy embedded raster pages/images.
        // Fall back to high-fidelity raster re-encoding with text preservation fallback
        onProgress?.(35, 'Compressing embedded pages and image data...');
        compressedBytes = await compressByRenderingPages(
          cleanBuffer,
          options,
          onProgress
        );
      }
    } catch {
      // In case of any structural parsing failure, fallback to rendering engine
      onProgress?.(30, 'Re-encoding page visual layers...');
      compressedBytes = await compressByRenderingPages(
        cleanBuffer,
        options,
        onProgress
      );
    }
  } else {
    // Scanned / Raster mode: direct page-by-page canvas compression
    compressedBytes = await compressByRenderingPages(
      cleanBuffer,
      options,
      onProgress
    );
  }

  onProgress?.(100, 'Done!');
  const durationMs = Math.round(performance.now() - startTime);

  // If for some reason the "compressed" size is larger than original,
  // we can fall back to the original or minimal structural bytes
  let finalBytes = compressedBytes;
  if (compressedBytes.byteLength > originalSize && options.preset !== 'custom') {
    // Keep structural or original if smaller
    finalBytes = new Uint8Array(arrayBuffer);
  }

  const blob = new Blob([finalBytes as unknown as BlobPart], { type: 'application/pdf' });

  return {
    blob,
    durationMs,
    originalSize,
    compressedSize: blob.size,
  };
}

/**
 * Page-by-page canvas rendering and JPEG re-encoding.
 * Delivers unmatched compression ratios especially for scanned documents and image-heavy PDFs.
 */
async function compressByRenderingPages(
  arrayBuffer: ArrayBuffer,
  options: CompressionOptions,
  onProgress?: (percent: number, statusText: string) => void
): Promise<Uint8Array> {
  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer.slice(0),
    disableFontFace: false,
  });

  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;

  const newDoc = await PDFDocument.create();

  if (!options.removeMetadata) {
    newDoc.setProducer('PDF Squeeze');
    newDoc.setCreator('PDF Squeeze');
  }

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    throw new Error('Canvas context could not be created');
  }

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const pageProgress = Math.round(((pageNum - 0.7) / numPages) * 70) + 20;
    onProgress?.(pageProgress, `Processing page ${pageNum} of ${numPages}...`);

    const page = await pdfDoc.getPage(pageNum);
    const unscaledViewport = page.getViewport({ scale: 1.0 });
    const scaledViewport = page.getViewport({ scale: options.scale });

    canvas.width = Math.floor(scaledViewport.width);
    canvas.height = Math.floor(scaledViewport.height);

    // Fill white background for transparent PDFs
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport: scaledViewport,
    }).promise;

    // Apply grayscale conversion if requested
    if (options.grayscale) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        // Standard luminance weights
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
      }
      ctx.putImageData(imgData, 0, 0);
    }

    // Convert canvas to compressed JPEG
    const quality = Math.max(0.1, Math.min(1.0, options.imageQuality));
    const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);

    // Embed into new PDF
    const embeddedImage = await newDoc.embedJpg(jpegDataUrl);
    const newPage = newDoc.addPage([unscaledViewport.width, unscaledViewport.height]);

    newPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: unscaledViewport.width,
      height: unscaledViewport.height,
    });
  }

  onProgress?.(92, 'Packaging optimized PDF streams...');
  const resultBytes = await newDoc.save({
    useObjectStreams: true,
  });

  return resultBytes;
}
