import React, { useState, useRef } from 'react';
import {
  FilePlus,
  ArrowUp,
  ArrowDown,
  Trash2,
  FileText,
  Layers,
  Sparkles,
  Download,
  Eye,
  CheckCircle2,
  Loader2,
  Hash,
  AlertCircle,
  FileCode,
  Image as ImageIcon,
  X,
  RefreshCw,
} from 'lucide-react';
import { MergeFileItem, MergeOptions, MergeResult } from '../types';
import { mergePDFs } from '../lib/pdfMerger';
import { extractPDFInfo } from '../lib/thumbnail';
import { formatBytes } from '../lib/utils';
import { detectConvertibleType } from '../lib/pdfConverter';

interface MergeViewProps {
  onPreviewMerged: (file: File, name: string) => void;
}

export const MergeView: React.FC<MergeViewProps> = ({ onPreviewMerged }) => {
  const [items, setItems] = useState<MergeFileItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeProgress, setMergeProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [options, setOptions] = useState<MergeOptions>({
    outputFilename: 'merged_document.pdf',
    addPageNumbers: true,
    addBookmarks: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (fileList: FileList | File[]) => {
    setErrorMessage(null);
    const newItems: MergeFileItem[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      let fileType: 'pdf' | 'image' | 'docx' | 'text' = 'pdf';

      if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
        fileType = 'pdf';
      } else if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp|gif|svg)$/i.test(file.name)) {
        fileType = 'image';
      } else if (/\.(docx|doc)$/i.test(file.name) || file.type.includes('wordprocessingml') || file.type.includes('msword')) {
        fileType = 'docx';
      } else {
        fileType = 'text';
      }

      // Check if file is empty (0 bytes)
      const isEmpty = file.size === 0;

      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        fileType,
        status: isEmpty ? 'error' : 'ready',
        error: isEmpty ? 'File is empty (0 bytes) and cannot be merged' : undefined,
      });
    }

    if (newItems.length === 0) return;

    setItems((prev) => [...prev, ...newItems]);
    setMergeResult(null);

    // Asynchronously validate content & extract thumbnails
    newItems.forEach(async (item) => {
      if (item.status === 'error') return;

      if (item.fileType === 'pdf') {
        try {
          const info = await extractPDFInfo(item.file);
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? {
                    ...it,
                    pageCount: info.pageCount,
                    thumbnailUrl: info.thumbnailUrl,
                    status: 'ready',
                    error: undefined,
                  }
                : it
            )
          );
        } catch (err: any) {
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? {
                    ...it,
                    status: 'error',
                    error: `Invalid PDF: ${err?.message || 'No valid PDF header found'}`,
                  }
                : it
            )
          );
        }
      } else if (item.fileType === 'image') {
        try {
          const url = URL.createObjectURL(item.file);
          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? { ...it, pageCount: 1, thumbnailUrl: url, status: 'ready' }
                : it
            )
          );
        } catch {
          // Keep as ready
        }
      } else if (item.fileType === 'docx') {
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, pageCount: 1, status: 'ready' } : it))
        );
      } else {
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, pageCount: 1, status: 'ready' } : it))
        );
      }
    });
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    setItems((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
    setMergeResult(null);
  };

  const removeItem = (id: string) => {
    setItems((prev) => {
      const target = prev.find((it) => it.id === id);
      if (target?.thumbnailUrl && target.fileType === 'image') {
        URL.revokeObjectURL(target.thumbnailUrl);
      }
      return prev.filter((it) => it.id !== id);
    });
    setMergeResult(null);
  };

  const removeInvalidFiles = () => {
    setItems((prev) => prev.filter((it) => it.status !== 'error'));
    setErrorMessage(null);
  };

  const handleMerge = async () => {
    setErrorMessage(null);

    // Validate that no error/empty items exist
    const invalidItems = items.filter((it) => it.status === 'error' || it.size === 0);
    if (invalidItems.length > 0) {
      setErrorMessage(
        `Cannot merge: "${invalidItems[0].name}" is empty or invalid. Please remove invalid files before proceeding.`
      );
      return;
    }

    if (items.length < 2) {
      setErrorMessage('Please add at least 2 valid documents or images to merge.');
      return;
    }

    setIsMerging(true);
    setMergeProgress(0);

    try {
      const result = await mergePDFs(items, options, (percent, text) => {
        setMergeProgress(percent);
        setProgressText(text);
      });
      setMergeResult(result);
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred during merging.');
    } finally {
      setIsMerging(false);
    }
  };

  const handleDownload = () => {
    if (!mergeResult) return;
    const a = document.createElement('a');
    a.href = mergeResult.url;
    a.download = options.outputFilename.endsWith('.pdf')
      ? options.outputFilename
      : `${options.outputFilename}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const hasInvalidItems = items.some((it) => it.status === 'error' || it.size === 0);
  const totalPages = items.reduce((sum, item) => sum + (item.pageCount || 1), 0);
  const totalBytes = items.reduce((sum, item) => sum + item.size, 0);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Intro Header */}
      <div className="text-center max-w-2xl mx-auto mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-3">
          <Layers className="w-3.5 h-3.5" />
          Multi-File PDF Merger
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Combine multiple PDFs, images & docs into one file
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Arrange files in your desired sequence. Processed 100% locally with zero file uploads.
        </p>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start justify-between gap-3 shadow-lg animate-fade-in">
          <div className="flex items-start gap-2.5 min-w-0">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-rose-300">Merge Error</p>
              <p className="mt-0.5 leading-relaxed text-rose-200/90">{errorMessage}</p>
              {hasInvalidItems && (
                <button
                  onClick={removeInvalidFiles}
                  className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold border border-rose-500/30 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Invalid Files</span>
                </button>
              )}
            </div>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="p-1 rounded-lg text-rose-400 hover:text-white hover:bg-rose-900/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
            ? 'border-blue-400 bg-blue-950/20 scale-[1.008]'
            : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf,image/*,.docx,.doc,.txt,.md,.json,.csv,.html"
          multiple
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto mb-3">
          <Layers className="w-7 h-7" />
        </div>
        <h3 className="font-bold text-white text-base">Drop files here to merge</h3>
        <p className="text-xs text-slate-400 mt-1">
          Supports PDFs, Images (PNG, JPG, WEBP), Word Documents (.docx), and Text (.txt)
        </p>
        <button
          type="button"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all"
        >
          <FilePlus className="w-4 h-4" />
          <span>Add Files to Merge</span>
        </button>
      </div>

      {/* File List / Ordering */}
      {items.length > 0 && (
        <div className="space-y-4">
          {/* Summary Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 gap-3">
            <div className="flex items-center gap-4 text-xs">
              <span className="font-bold text-white text-sm">
                {items.length} files in queue
              </span>
              <span className="text-slate-400">Total: {formatBytes(totalBytes)}</span>
              <span className="text-blue-400 font-mono">~{totalPages} pages</span>
            </div>

            <div className="flex items-center gap-4 text-xs w-full sm:w-auto justify-between sm:justify-end">
              {hasInvalidItems && (
                <button
                  onClick={removeInvalidFiles}
                  className="text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove invalid</span>
                </button>
              )}

              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.addPageNumbers}
                  onChange={(e) => setOptions({ ...options, addPageNumbers: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-0"
                />
                <Hash className="w-3.5 h-3.5 text-blue-400" />
                <span>Add page numbers</span>
              </label>
            </div>
          </div>

          {/* List items with Up/Down buttons */}
          <div className="space-y-2">
            {items.map((item, index) => {
              const isError = item.status === 'error';

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    isError
                      ? 'bg-rose-950/20 border-rose-500/50 hover:border-rose-500'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                        isError
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {index + 1}
                    </span>

                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt=""
                        className="w-10 h-12 object-cover rounded bg-slate-950 border border-slate-800 shrink-0"
                      />
                    ) : item.fileType === 'docx' ? (
                      <div className="w-10 h-12 rounded bg-blue-950/40 border border-blue-800/40 flex items-center justify-center text-blue-400 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                    ) : item.fileType === 'text' ? (
                      <div className="w-10 h-12 rounded bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                        <FileCode className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-10 h-12 rounded bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={`font-semibold text-xs sm:text-sm truncate ${
                            isError ? 'text-rose-200' : 'text-white'
                          }`}
                          title={item.name}
                        >
                          {item.name}
                        </p>
                        <span className="px-1.5 py-0.2 rounded text-[10px] uppercase font-mono font-bold bg-slate-800 text-slate-400">
                          {item.fileType}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] font-mono mt-0.5">
                        <span className={item.size === 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                          {formatBytes(item.size)}
                        </span>
                        {item.pageCount && !isError && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span className="text-blue-400">{item.pageCount} page(s)</span>
                          </>
                        )}
                        {isError && item.error && (
                          <>
                            <span className="text-slate-600">•</span>
                            <span className="text-rose-400 flex items-center gap-1 font-sans">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              {item.error}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => moveItem(index, 'up')}
                      disabled={index === 0 || isMerging}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-20 transition-colors"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => moveItem(index, 'down')}
                      disabled={index === items.length - 1 || isMerging}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-20 transition-colors"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={isMerging}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Merge Options & Trigger */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-auto flex-1 max-w-sm">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Output File Name
              </label>
              <input
                type="text"
                value={options.outputFilename}
                onChange={(e) => setOptions({ ...options, outputFilename: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                onClick={handleMerge}
                disabled={items.length < 2 || isMerging || hasInvalidItems}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMerging ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Merging ({mergeProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Merge {items.length} Files</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Merge Progress Bar */}
          {isMerging && (
            <div className="w-full bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between text-xs mb-1 text-slate-300">
                <span>{progressText}</span>
                <span className="font-mono text-blue-400">{mergeProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300 rounded-full"
                  style={{ width: `${mergeProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Merge Success Card */}
          {mergeResult && !isMerging && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-950 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm sm:text-base">
                    Documents merged successfully!
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    {mergeResult.pageCount} pages • {formatBytes(mergeResult.size)} • in{' '}
                    {(mergeResult.durationMs / 1000).toFixed(1)}s
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  onClick={() => {
                    const mergedFile = new File([mergeResult.blob], options.outputFilename, {
                      type: 'application/pdf',
                    });
                    onPreviewMerged(mergedFile, options.outputFilename);
                  }}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Merged PDF</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
