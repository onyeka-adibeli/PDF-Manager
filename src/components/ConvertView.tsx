import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import {
  FilePlus,
  RefreshCw,
  Trash2,
  FileText,
  FileCode,
  Image as ImageIcon,
  Sparkles,
  Download,
  Eye,
  CheckCircle2,
  Loader2,
  Sliders,
  Archive,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { ConvertFileItem, ConvertOptions } from '../types';
import {
  detectConvertibleType,
  convertSingleFile,
  convertMultipleFilesToOnePdf,
} from '../lib/pdfConverter';
import { formatBytes } from '../lib/utils';

interface ConvertViewProps {
  onPreviewConverted: (file: File, name: string) => void;
}

export const ConvertView: React.FC<ConvertViewProps> = ({ onPreviewConverted }) => {
  const [items, setItems] = useState<ConvertFileItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [combinedResult, setCombinedResult] = useState<{
    blob: Blob;
    url: string;
    size: number;
    pageCount: number;
    durationMs?: number;
  } | null>(null);

  const [options, setOptions] = useState<ConvertOptions>({
    pageSize: 'a4',
    orientation: 'auto',
    margin: 'small',
    imageQuality: 0.9,
    combineIntoSinglePdf: false,
    combinedFilename: 'converted_document.pdf',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (fileList: FileList | File[]) => {
    const newItems: ConvertFileItem[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const type = detectConvertibleType(file);

      // Create thumbnail for images
      let thumb: string | undefined = undefined;
      if (type === 'image') {
        thumb = URL.createObjectURL(file);
      }

      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        type,
        thumbnailUrl: thumb,
        status: 'idle',
        progress: 0,
      });
    }

    if (newItems.length === 0) return;
    setItems((prev) => [...prev, ...newItems]);
    setCombinedResult(null);
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target?.convertedUrl) URL.revokeObjectURL(target.convertedUrl);
      if (target?.thumbnailUrl && target.type === 'image') URL.revokeObjectURL(target.thumbnailUrl);
      return prev.filter((it) => it.id !== id);
    });
    setCombinedResult(null);
  };

  const convertOne = async (id: string) => {
    const item = items.find((it) => it.id === id);
    if (!item) return;

    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status: 'converting', progress: 10 } : it))
    );

    try {
      const res = await convertSingleFile(item, options, (pct) => {
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, progress: pct } : it)));
      });

      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? {
                ...it,
                status: 'completed',
                progress: 100,
                convertedBlob: res.blob,
                convertedUrl: res.url,
                convertedSize: res.size,
                durationMs: res.durationMs,
              }
            : it
        )
      );
    } catch (err: any) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? {
                ...it,
                status: 'error',
                error: err?.message || 'Conversion failed',
              }
            : it
        )
      );
    }
  };

  const handleConvertAll = async () => {
    if (items.length === 0 || isConverting) return;
    setIsConverting(true);

    if (options.combineIntoSinglePdf) {
      // Combine all files into a single master PDF
      try {
        setItems((prev) => prev.map((it) => ({ ...it, status: 'converting', progress: 50 })));
        const res = await convertMultipleFilesToOnePdf(items, options);
        setCombinedResult(res);
        setItems((prev) => prev.map((it) => ({ ...it, status: 'completed', progress: 100 })));
      } catch (err: any) {
        alert(`Conversion failed: ${err?.message || 'Unknown error'}`);
      } finally {
        setIsConverting(false);
      }
    } else {
      // Convert each individually
      for (const item of items) {
        if (item.status !== 'completed') {
          await convertOne(item.id);
        }
      }
      setIsConverting(false);
    }
  };

  const downloadOne = (id: string) => {
    const item = items.find((it) => it.id === id);
    if (!item || !item.convertedUrl) return;

    const base = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
    const a = document.createElement('a');
    a.href = item.convertedUrl;
    a.download = `${base}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadAllZip = async () => {
    const completed = items.filter((it) => it.status === 'completed' && it.convertedBlob);
    if (completed.length === 0) return;

    const zip = new JSZip();
    completed.forEach((it) => {
      if (it.convertedBlob) {
        const base = it.name.substring(0, it.name.lastIndexOf('.')) || it.name;
        zip.file(`${base}.pdf`, it.convertedBlob);
      }
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted_pdfs_${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const completedCount = items.filter((it) => it.status === 'completed').length;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Intro Header */}
      <div className="text-center max-w-2xl mx-auto mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-3">
          <RefreshCw className="w-3.5 h-3.5" />
          Universal File to PDF Converter
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Convert Images, Word Docs & Text to PDF
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Supports PNG, JPG, WEBP, SVG, DOCX, DOC, TXT, MD, and CSV. 100% in-browser conversion.
        </p>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-2xl p-6 sm:p-8 text-center transition-all duration-200 border-2 border-dashed ${
          isDragOver
            ? 'border-purple-400 bg-purple-950/20 scale-[1.008]'
            : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.docx,.doc,.txt,.md,.json,.csv,.html"
          multiple
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mx-auto mb-3">
          <RefreshCw className="w-7 h-7" />
        </div>
        <h3 className="font-bold text-white text-base">Drop files to convert to PDF</h3>
        <p className="text-xs text-slate-400 mt-1">
          PNG, JPG, WEBP, GIF, SVG, Word (.docx), Markdown (.md), Plain text (.txt), and CSV
        </p>
        <button
          type="button"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all"
        >
          <FilePlus className="w-4 h-4" />
          <span>Select Files to Convert</span>
        </button>
      </div>

      {/* Options Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <Sliders className="w-3.5 h-3.5 text-purple-400" />
          Conversion Preferences
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Combine Mode */}
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="block text-[11px] text-slate-400 mb-1">Output Mode</span>
            <label className="flex items-center gap-2 cursor-pointer text-slate-200 mt-1">
              <input
                type="checkbox"
                checked={options.combineIntoSinglePdf}
                onChange={(e) =>
                  setOptions({ ...options, combineIntoSinglePdf: e.target.checked })
                }
                className="rounded bg-slate-800 border-slate-700 text-purple-500 focus:ring-0"
              />
              <span className="font-semibold">Combine into 1 PDF</span>
            </label>
          </div>

          {/* Page Size */}
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <label className="block text-[11px] text-slate-400 mb-1">Page Size</label>
            <select
              value={options.pageSize}
              onChange={(e) =>
                setOptions({ ...options, pageSize: e.target.value as 'a4' | 'letter' | 'auto' })
              }
              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500 text-xs"
            >
              <option value="a4">A4 Standard</option>
              <option value="letter">US Letter</option>
              <option value="auto">Auto (Match Image Ratio)</option>
            </select>
          </div>

          {/* Orientation */}
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <label className="block text-[11px] text-slate-400 mb-1">Orientation</label>
            <select
              value={options.orientation}
              onChange={(e) =>
                setOptions({
                  ...options,
                  orientation: e.target.value as 'auto' | 'portrait' | 'landscape',
                })
              }
              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500 text-xs"
            >
              <option value="auto">Auto Detect</option>
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>

          {/* Margins */}
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
            <label className="block text-[11px] text-slate-400 mb-1">Margins</label>
            <select
              value={options.margin}
              onChange={(e) =>
                setOptions({
                  ...options,
                  margin: e.target.value as 'none' | 'small' | 'normal',
                })
              }
              className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-purple-500 text-xs"
            >
              <option value="small">Small (18pt)</option>
              <option value="normal">Normal (36pt)</option>
              <option value="none">None (Full Bleed)</option>
            </select>
          </div>
        </div>
      </div>

      {/* File List */}
      {items.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xs font-bold text-white">
              {items.length} file(s) loaded
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleConvertAll}
                disabled={isConverting}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/25 transition-all disabled:opacity-50"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Converting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {options.combineIntoSinglePdf
                        ? 'Combine & Convert to 1 PDF'
                        : `Convert All (${items.length})`}
                    </span>
                  </>
                )}
              </button>

              {!options.combineIntoSinglePdf && completedCount > 1 && (
                <button
                  onClick={downloadAllZip}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
                >
                  <Archive className="w-3.5 h-3.5 text-purple-400" />
                  <span>Download ZIP</span>
                </button>
              )}
            </div>
          </div>

          {/* Combined Result Card */}
          {combinedResult && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">
                    Combined PDF ready ({combinedResult.pageCount} pages)
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    {formatBytes(combinedResult.size)}
                    {combinedResult.durationMs !== undefined && (
                      <span> • in {(combinedResult.durationMs / 1000).toFixed(1)}s</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    const f = new File([combinedResult.blob], options.combinedFilename, {
                      type: 'application/pdf',
                    });
                    onPreviewConverted(f, options.combinedFilename);
                  }}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = combinedResult.url;
                    a.download = options.combinedFilename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          )}

          {/* Cards for each item */}
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 gap-3 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt=""
                      className="w-10 h-10 object-cover rounded bg-slate-950 border border-slate-800 shrink-0"
                    />
                  ) : item.type === 'docx' ? (
                    <div className="w-10 h-10 rounded bg-blue-950/40 border border-blue-800/40 text-blue-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded bg-slate-950 border border-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                      <FileCode className="w-5 h-5" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white text-xs sm:text-sm truncate" title={item.name}>
                        {item.name}
                      </p>
                      <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-mono font-bold bg-slate-800 text-slate-400">
                        {item.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                      <span>{formatBytes(item.size)}</span>
                      {item.convertedSize && (
                        <>
                          <ArrowRight className="w-3 h-3 text-slate-600" />
                          <span className="text-purple-400 font-bold">
                            {formatBytes(item.convertedSize)} (PDF)
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {item.status === 'idle' && !options.combineIntoSinglePdf && (
                    <button
                      onClick={() => convertOne(item.id)}
                      disabled={isConverting}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Convert</span>
                    </button>
                  )}

                  {item.status === 'completed' && item.convertedBlob && (
                    <>
                      <button
                        onClick={() => {
                          const f = new File([item.convertedBlob!], `${item.name}.pdf`, {
                            type: 'application/pdf',
                          });
                          onPreviewConverted(f, `${item.name}.pdf`);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                        title="Preview"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => downloadOne(item.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
