# PDF Squeeze 📄⚡
### Ultra-Fast, 100% Private Client-Side PDF Suite (Compress, Merge & Convert)

A modern, production-grade PDF utility web application built with **React 18**, **TypeScript**, **Vite**, **Tailwind CSS**, **pdf-lib**, **PDF.js**, and **Mammoth.js**.

All processing runs **100% in the browser** using client-side WebAssembly, canvas rendering, and object stream manipulation. Your sensitive documents (bank statements, IDs, contracts, Word documents, photos) **never leave your device or touch any external server**.

---

## ✨ Features

### 1. 🗜️ PDF Compressor
- **Smart Hybrid Mode**: Preserves selectable text, vectors, and font fidelity while deflating structural streams and recompressing embedded images.
- **Scanned Document Mode**: Re-renders pages at target DPI and quality, achieving **60% to 90% size reductions** for scanned forms, invoices, and receipts.
- **4 Presets**: Extreme (<1MB target), Recommended (balanced 40–70% reduction), High Quality, and Custom (quality & DPI scale sliders, grayscale toggle, metadata stripping).
- **Interactive Side-by-Side Comparison**: Zoom in, flip pages, and inspect quality before downloading.

### 2. 📑 PDF & File Merger
- **Combine Multiple PDFs & Images**: Merge multiple PDF documents and photos into one master PDF.
- **Visual Reordering**: Move files up/down to set the exact sequence before combining.
- **Page Numbers**: Automatically add sequential page numbers (`Page X of Y`).
- **Page Count & Size Tracker**: Displays page count for each file and total combined pages.
- **Instant Preview**: Inspect the merged document directly in the browser before downloading.

### 3. 🔄 Universal File Converter (to PDF)
- **Images to PDF**: Convert **PNG, JPG, JPEG, WEBP, GIF, BMP, and SVG** images into PDF.
- **Word Documents to PDF**: Convert **Word documents (.docx, .doc)** directly into clean, formatted A4 PDF pages with headings, styled paragraphs, and tables.
- **Text & Code to PDF**: Convert **Plain text (.txt), Markdown (.md), CSV, JSON, and HTML** into formatted PDF pages with auto-pagination.
- **Batch or Combined**: Choose between converting each file to an individual PDF (with ZIP export) or combining all uploaded files into a single unified PDF.
- **Page Customization**: Choose Page Size (A4, US Letter, Auto-Fit), Orientation (Portrait, Landscape, Auto), and Margins (None, Small, Normal).

---

## 🔒 100% Client-Side Privacy Guarantee
Zero file uploads. No server backend. Fully compliant with GDPR, HIPAA, and corporate confidential data policies. Works completely offline!

---

## 🛠️ Quick Start

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **npm** or **pnpm**

### 2. Development Server
Start the local development server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 3. Production Build
Build optimized production assets:
```bash
npm run build
```
The static output will be generated in the `dist/` directory, ready to deploy.

### 4. Preview Production Build
```bash
npm run preview
```

---

## 🌐 Deployment Guide

### Vercel
1. Push your repository to GitHub or GitLab.
2. Import the project into [Vercel](https://vercel.com).
3. Framework preset: **Vite**.
4. Build command: `npm run build`
5. Output directory: `dist`

### Netlify
1. Connect your repository on [Netlify](https://netlify.com).
2. Build command: `npm run build`
3. Publish directory: `dist`

### Cloudflare Pages / GitHub Pages
Upload or link the repository and set the build directory to `dist`. Relative paths (`base: './'`) are pre-configured in `vite.config.ts` for instant hosting on any subdirectory.

---

## 📂 Project Structure

```
Pdf Compress/
├── src/
│   ├── components/
│   │   ├── Navbar.tsx             # Header with privacy badge & clear action
│   │   ├── PrivacyBanner.tsx      # In-browser security guarantee & details
│   │   ├── PresetSelector.tsx     # Extreme, Recommended, High, Custom cards
│   │   ├── CustomSettingsPanel.tsx# Sliders for quality, scale, grayscale & mode
│   │   ├── Dropzone.tsx           # Multi-file drag & drop, file picker & paste
│   │   ├── FileCard.tsx           # Progress bar, size metrics & download actions
│   │   ├── BatchActionBar.tsx     # Batch compress & ZIP download triggers
│   │   ├── PreviewModal.tsx       # Side-by-side page preview & zoom viewer
│   │   └── StatsFooter.tsx        # Technical overview & architecture notes
│   ├── lib/
│   │   ├── pdfCompressor.ts       # Core dual-engine compression logic
│   │   ├── pdfWorker.ts           # PDF.js worker configuration
│   │   ├── thumbnail.ts           # Page 1 canvas renderer & page count
│   │   └── utils.ts               # Byte formatting, percent calculation
│   ├── types/
│   │   └── index.ts               # TypeScript interfaces & types
│   ├── App.tsx                    # Main state management
│   ├── index.css                  # Tailwind styles & animations
│   └── main.tsx                   # Entry point
├── index.html                     # HTML5 template
├── package.json                   # Dependencies & scripts
├── tailwind.config.js             # Styling configuration
├── tsconfig.json                  # TypeScript compiler settings
└── vite.config.ts                 # Bundler config with code-splitting
```

---

## 📄 License
MIT License. Free to use, modify, and distribute.

