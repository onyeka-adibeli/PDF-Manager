export type AppTab = 'compress' | 'merge' | 'convert';

export type CompressionPreset = 'extreme' | 'recommended' | 'low' | 'custom';

export type CompressionMode = 'smart' | 'scanned';

export interface CompressionOptions {
  preset: CompressionPreset;
  mode: CompressionMode;
  imageQuality: number; // 0.1 to 1.0 (e.g. 0.6 = 60%)
  scale: number;        // Canvas resolution scale (e.g. 0.8 to 2.0)
  grayscale: boolean;   // Convert colors to grayscale for maximum compression
  removeMetadata: boolean; // Strip author, producer, title, etc.
  preserveTextLayer: boolean; // Preserves vector text when possible
}

export interface FileItem {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  compressedSize?: number;
  compressedBlob?: Blob;
  compressedUrl?: string;
  originalUrl?: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  progress: number; // 0 to 100
  pageCount?: number;
  thumbnailUrl?: string;
  error?: string;
  durationMs?: number;
  optionsUsed?: CompressionOptions;
}

export interface PresetConfig {
  id: CompressionPreset;
  label: string;
  tagline: string;
  badge: string;
  description: string;
  mode: CompressionMode;
  imageQuality: number;
  scale: number;
  grayscale: boolean;
  removeMetadata: boolean;
  preserveTextLayer: boolean;
  expectedSavings: string;
  color: string;
}

/* ================= File Merge Types ================= */

export interface MergeFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount?: number;
  thumbnailUrl?: string;
  status: 'ready' | 'processing' | 'error';
  error?: string;
}

export interface MergeOptions {
  outputFilename: string;
  addPageNumbers: boolean;
  addBookmarks: boolean;
}

export interface MergeResult {
  blob: Blob;
  url: string;
  size: number;
  pageCount: number;
  durationMs: number;
}

/* ================= File Converter Types ================= */

export type ConvertibleFileType = 'image' | 'docx' | 'text';

export interface ConvertFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: ConvertibleFileType;
  thumbnailUrl?: string;
  status: 'idle' | 'converting' | 'completed' | 'error';
  progress: number;
  convertedBlob?: Blob;
  convertedUrl?: string;
  convertedSize?: number;
  error?: string;
  durationMs?: number;
}

export interface ConvertOptions {
  pageSize: 'a4' | 'letter' | 'auto';
  orientation: 'portrait' | 'landscape' | 'auto';
  margin: 'none' | 'small' | 'normal';
  imageQuality: number;
  combineIntoSinglePdf: boolean;
  combinedFilename: string;
}
