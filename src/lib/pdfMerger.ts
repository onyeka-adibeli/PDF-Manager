import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { MergeFileItem, MergeOptions, MergeResult } from '../types';
import { convertImageToPdfPage } from './pdfConverter';

/**
 * Merges multiple PDF files and images in a specified sequence into a single PDF document.
 */
export async function mergePDFs(
  items: MergeFileItem[],
  options: MergeOptions,
  onProgress?: (percent: number, statusText: string) => void
): Promise<MergeResult> {
  const startTime = performance.now();
  onProgress?.(5, 'Initializing merge engine...');

  const mergedDoc = await PDFDocument.create();
  mergedDoc.setProducer('PDF Squeeze');
  mergedDoc.setCreator('PDF Squeeze');

  const totalFiles = items.length;

  for (let i = 0; i < totalFiles; i++) {
    const item = items[i];
    const filePercent = Math.round((i / totalFiles) * 85) + 10;
    onProgress?.(filePercent, `Merging (${i + 1}/${totalFiles}): ${item.name}...`);

    const file = item.file;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp|gif|svg)$/i.test(file.name);

    if (isPdf) {
      const arrayBuffer = await file.arrayBuffer();
      const srcDoc = await PDFDocument.load(arrayBuffer.slice(0), { ignoreEncryption: true });
      const copiedPages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
      copiedPages.forEach((page) => mergedDoc.addPage(page));
    } else if (isImage) {
      // Allow seamless inclusion of images inside the merge flow!
      await convertImageToPdfPage(file, mergedDoc);
    }
  }

  // Add page numbers if enabled
  if (options.addPageNumbers) {
    onProgress?.(92, 'Adding sequential page numbers...');
    const font = await mergedDoc.embedFont(StandardFonts.Helvetica);
    const totalPages = mergedDoc.getPageCount();

    for (let p = 0; p < totalPages; p++) {
      const page = mergedDoc.getPage(p);
      const { width } = page.getSize();
      const pageText = `Page ${p + 1} of ${totalPages}`;
      const textWidth = font.widthOfTextAtSize(pageText, 9);

      page.drawText(pageText, {
        x: (width - textWidth) / 2,
        y: 20,
        size: 9,
        font: font,
        color: rgb(0.35, 0.4, 0.45),
      });
    }
  }

  onProgress?.(96, 'Finalizing merged document streams...');
  const mergedBytes = await mergedDoc.save({ useObjectStreams: true });
  const blob = new Blob([mergedBytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const durationMs = Math.round(performance.now() - startTime);

  onProgress?.(100, 'Merge completed successfully!');

  return {
    blob,
    url,
    size: blob.size,
    pageCount: mergedDoc.getPageCount(),
    durationMs,
  };
}
