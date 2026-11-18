import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatPercent(original: number, compressed: number): {
  percent: number;
  formatted: string;
  isReduction: boolean;
} {
  if (!original || !compressed) return { percent: 0, formatted: '0%', isReduction: false };
  const diff = original - compressed;
  const percent = Math.round((diff / original) * 100);
  if (percent >= 0) {
    return { percent, formatted: `-${percent}%`, isReduction: true };
  } else {
    return { percent: Math.abs(percent), formatted: `+${Math.abs(percent)}%`, isReduction: false };
  }
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
}

export function generateCompressedFilename(originalName: string): string {
  const lastDot = originalName.lastIndexOf('.');
  if (lastDot === -1) return `${originalName}_compressed.pdf`;
  const base = originalName.substring(0, lastDot);
  return `${base}_compressed.pdf`;
}

