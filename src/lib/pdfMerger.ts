import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { MergeFileItem, MergeOptions, MergeResult } from '../types';
import {
  convertImageToPdfPage,
  convertDocxToPdf,
  convertTextToPdf,
  detectConvertibleType,
} from './pdfConverter';

/**
 * Scans for %PDF- in buffer and trims leading whitespace/BOM or server wrapper bytes.
 */
export function sanitizePdfBuffer(buffer: ArrayBuffer): {
  cleanBuffer: ArrayBuffer;
  isValidPdf: boolean;
} {
  if (!buffer || buffer.byteLength === 0) {
    return { cleanBuffer: buffer, isValidPdf: false };
  }

  const bytes = new Uint8Array(buffer);
  const pdfHeader = [0x25, 0x50, 0x44, 0x46, 0x2d]; // '%PDF-'

  // Search within the first 2048 bytes
  const searchLimit = Math.min(bytes.length - 4, 2048);
  for (let i = 0; i < searchLimit; i++) {
    if (
      bytes[i] === pdfHeader[0] &&
      bytes[i + 1] === pdfHeader[1] &&
      bytes[i + 2] === pdfHeader[2] &&
      bytes[i + 3] === pdfHeader[3] &&
      bytes[i + 4] === pdfHeader[4]
    ) {
      return {
        cleanBuffer: i > 0 ? buffer.slice(i) : buffer,
        isValidPdf: true,
      };
    }
  }

  return { cleanBuffer: buffer, isValidPdf: false };
}

/**
 * Merges multiple PDF files, images, Word docs, and text files in a specified sequence into a single PDF document.
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

    // Check for empty 0-byte file
    if (!file || file.size === 0) {
      throw new Error(
        `File "${item.name}" is empty (0 bytes). Please remove this file from the list or replace it with a valid document.`
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error(
        `File "${item.name}" has no readable content (0 bytes).`
      );
    }

    const { cleanBuffer, isValidPdf } = sanitizePdfBuffer(arrayBuffer);

    if (isValidPdf) {
      // Valid PDF document with %PDF- header
      try {
        const srcDoc = await PDFDocument.load(cleanBuffer, { ignoreEncryption: true });
        const pageIndices = srcDoc.getPageIndices();
        if (pageIndices.length === 0) {
          throw new Error('Document contains 0 pages.');
        }
        const copiedPages = await mergedDoc.copyPages(srcDoc, pageIndices);
        copiedPages.forEach((page) => mergedDoc.addPage(page));
      } catch (pdfErr: any) {
        throw new Error(
          `Unable to parse PDF "${item.name}": ${pdfErr?.message || 'The PDF data is damaged or corrupted'}.`
        );
      }
    } else {
      // No %PDF- header found. Check if it's an image, docx, or text file!
      const detectedType = item.fileType || detectConvertibleType(file);

      try {
        if (detectedType === 'image') {
          onProgress?.(filePercent, `Converting image (${i + 1}/${totalFiles}): ${item.name}...`);
          await convertImageToPdfPage(file, mergedDoc);
        } else if (detectedType === 'docx') {
          onProgress?.(filePercent, `Converting Word document (${i + 1}/${totalFiles}): ${item.name}...`);
          await convertDocxToPdf(file, mergedDoc);
        } else if (detectedType === 'text') {
          onProgress?.(filePercent, `Converting text (${i + 1}/${totalFiles}): ${item.name}...`);
          await convertTextToPdf(file, mergedDoc);
        } else {
          throw new Error(
            `File "${item.name}" is not a valid PDF document (no PDF header found). ` +
            `Ensure the file is not corrupted or convert it to PDF before merging.`
          );
        }
      } catch (convErr: any) {
        throw new Error(
          `Failed to process "${item.name}": ${convErr?.message || 'Unsupported or corrupted format'}.`
        );
      }
    }
  }

  // Check that at least one page was merged
  if (mergedDoc.getPageCount() === 0) {
    throw new Error('No valid pages could be merged into the final document.');
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
