import { PDFDocument, rgb } from 'pdf-lib';
import fs from 'fs';

async function generateSample() {
  const doc = await PDFDocument.create();
  
  // Page 1
  const page1 = doc.addPage([595, 842]); // A4
  page1.drawText('PDF Squeeze — Sample Document', {
    x: 50,
    y: 780,
    size: 22,
    color: rgb(0.08, 0.65, 0.35),
  });
  
  page1.drawText('This sample PDF demonstrates local, client-side PDF compression.', {
    x: 50,
    y: 740,
    size: 13,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  page1.drawText('Features verified:', {
    x: 50,
    y: 700,
    size: 14,
    color: rgb(0.1, 0.1, 0.1),
  });

  const features = [
    '• 100% In-Browser Privacy (Zero Server Uploads)',
    '• Smart Vector & Selectable Text Preservation',
    '• Scanned Document Raster Compression',
    '• 4 Presets: Extreme, Recommended, High Quality, Custom',
    '• Interactive Before vs After Quality Preview',
    '• Batch Compression & ZIP Download'
  ];

  features.forEach((feat, index) => {
    page1.drawText(feat, {
      x: 60,
      y: 670 - index * 25,
      size: 12,
      color: rgb(0.3, 0.3, 0.3),
    });
  });

  // Page 2
  const page2 = doc.addPage([595, 842]);
  page2.drawText('Page 2 — Document Technical Details', {
    x: 50,
    y: 780,
    size: 18,
    color: rgb(0.1, 0.1, 0.1),
  });

  page2.drawText('Ready to test drag-and-drop compression in PDF Squeeze!', {
    x: 50,
    y: 740,
    size: 12,
    color: rgb(0.4, 0.4, 0.4),
  });

  const bytes = await doc.save();
  fs.writeFileSync('sample_document.pdf', bytes);
  console.log(`Successfully generated sample_document.pdf (${bytes.length} bytes)`);
}

generateSample();

