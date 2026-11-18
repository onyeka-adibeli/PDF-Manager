import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  ArrowRight,
  Loader2,
  FileText,
} from 'lucide-react';
import { FileItem } from '../types';
import { pdfjsLib } from '../lib/pdfWorker';
import { formatBytes, formatPercent } from '../lib/utils';

interface PreviewModalProps {
  item: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (id: string) => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  item,
  isOpen,
  onClose,
  onDownload,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(1.2);
  const [loading, setLoading] = useState(true);

  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const compressedCanvasRef = useRef<HTMLCanvasElement>(null);

  const hasCompressed = !!item?.compressedBlob;
  const [activeTab, setActiveTab] = useState<'split' | 'original' | 'compressed'>(
    hasCompressed ? 'split' : 'original'
  );

  useEffect(() => {
    if (hasCompressed) {
      setActiveTab('split');
    } else {
      setActiveTab('original');
    }
  }, [hasCompressed]);

  const renderPages = useCallback(async () => {
    if (!item) return;
    setLoading(true);

    try {
      // 1. Render Original
      const origBuffer = await item.file.arrayBuffer();
      const origTask = pdfjsLib.getDocument({ data: origBuffer.slice(0) });
      const origDoc = await origTask.promise;
      setTotalPages(origDoc.numPages);

      const origPage = await origDoc.getPage(currentPage);
      const origViewport = origPage.getViewport({ scale: zoom });

      if (originalCanvasRef.current) {
        const origCanvas = originalCanvasRef.current;
        origCanvas.width = origViewport.width;
        origCanvas.height = origViewport.height;
        const ctx = origCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, origCanvas.width, origCanvas.height);
          await origPage.render({ canvasContext: ctx, viewport: origViewport }).promise;
        }
      }

      // 2. Render Compressed (if available)
      if (item.compressedBlob && compressedCanvasRef.current) {
        const compBuffer = await item.compressedBlob.arrayBuffer();
        const compTask = pdfjsLib.getDocument({ data: compBuffer.slice(0) });
        const compDoc = await compTask.promise;

        const compPage = await compDoc.getPage(currentPage);
        const compViewport = compPage.getViewport({ scale: zoom });

        const compCanvas = compressedCanvasRef.current;
        compCanvas.width = compViewport.width;
        compCanvas.height = compViewport.height;
        const ctx = compCanvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, compCanvas.width, compCanvas.height);
          await compPage.render({ canvasContext: ctx, viewport: compViewport }).promise;
        }
      }
    } catch (err) {
      console.error('Error rendering preview:', err);
    } finally {
      setLoading(false);
    }
  }, [item, currentPage, zoom]);

  useEffect(() => {
    if (isOpen && item) {
      setCurrentPage(1);
      renderPages();
    }
  }, [isOpen, item]);

  useEffect(() => {
    if (isOpen && item) {
      renderPages();
    }
  }, [currentPage, zoom, renderPages]);

  if (!isOpen || !item) return null;

  const savings =
    item.compressedSize && item.originalSize
      ? formatPercent(item.originalSize, item.compressedSize)
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-6xl h-[92vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-white text-sm sm:text-base truncate" title={item.name}>
                {item.name}
              </h3>
              <div className="flex items-center gap-2 text-xs font-mono mt-0.5">
                <span className="text-slate-400">{formatBytes(item.originalSize)}</span>
                {item.compressedSize && (
                  <>
                    <ArrowRight className="w-3 h-3 text-slate-600" />
                    <span className="text-emerald-400 font-bold">
                      {formatBytes(item.compressedSize)}
                    </span>
                    {savings && savings.isReduction && (
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                        {savings.formatted}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* View Mode Toggle (Mobile/Desktop) - only if both versions exist */}
            {hasCompressed && (
              <div className="hidden sm:flex items-center rounded-lg bg-slate-800/80 p-0.5 border border-slate-700 text-xs font-medium">
                <button
                  onClick={() => setActiveTab('split')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    activeTab === 'split' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Side by Side
                </button>
                <button
                  onClick={() => setActiveTab('original')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    activeTab === 'original' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Original
                </button>
                <button
                  onClick={() => setActiveTab('compressed')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    activeTab === 'compressed' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Compressed
                </button>
              </div>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700 text-xs">
              <button
                onClick={() => setZoom((z) => Math.max(0.6, z - 0.2))}
                className="p-1 hover:text-white text-slate-400"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono text-slate-300 w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
                className="p-1 hover:text-white text-slate-400"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => onDownload(item.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Canvas Viewing Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-950/90 relative">
          {loading && (
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-10">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-medium shadow-xl">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Rendering preview...</span>
              </div>
            </div>
          )}

          <div
            className={`grid gap-6 justify-center items-start min-h-full ${
              hasCompressed && activeTab === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
            }`}
          >
            {/* Original Panel */}
            {(activeTab === 'split' || activeTab === 'original' || !hasCompressed) && (
              <div className="flex flex-col items-center">
                {hasCompressed && (
                  <div className="mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <span>Original Document</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      ({formatBytes(item.originalSize)})
                    </span>
                  </div>
                )}
                <div className="bg-white rounded-lg shadow-2xl p-1 overflow-hidden ring-1 ring-slate-800">
                  <canvas ref={originalCanvasRef} className="max-w-full h-auto block" />
                </div>
              </div>
            )}

            {/* Compressed Panel */}
            {hasCompressed && (activeTab === 'split' || activeTab === 'compressed') && (
              <div className="flex flex-col items-center">
                <div className="mb-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <span>Compressed Output</span>
                  {item.compressedSize && (
                    <span className="text-[10px] font-mono font-bold text-emerald-300">
                      ({formatBytes(item.compressedSize)})
                    </span>
                  )}
                </div>
                <div className="bg-white rounded-lg shadow-2xl p-1 overflow-hidden ring-1 ring-emerald-500/30">
                  <canvas ref={compressedCanvasRef} className="max-w-full h-auto block" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Page Navigation */}
        <div className="px-5 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span className="font-mono">
            Page {currentPage} of {totalPages}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
