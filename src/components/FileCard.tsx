import React from 'react';
import {
  FileText,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { FileItem } from '../types';
import { formatBytes, formatPercent } from '../lib/utils';

interface FileCardProps {
  item: FileItem;
  onCompress: (id: string) => void;
  onDownload: (id: string) => void;
  onRemove: (id: string) => void;
  onPreview: (id: string) => void;
  isAnyProcessing: boolean;
}

export const FileCard: React.FC<FileCardProps> = ({
  item,
  onCompress,
  onDownload,
  onRemove,
  onPreview,
  isAnyProcessing,
}) => {
  const savings =
    item.compressedSize && item.originalSize
      ? formatPercent(item.originalSize, item.compressedSize)
      : null;

  return (
    <div className="relative group rounded-2xl bg-slate-900/60 border border-slate-800/80 p-4 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/90 shadow-lg">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Thumbnail or Fallback Icon */}
        <div className="relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden shadow-inner group/thumb">
          {item.thumbnailUrl ? (
            <img
              src={item.thumbnailUrl}
              alt="PDF preview"
              className="w-full h-full object-cover object-top"
            />
          ) : (
            <FileText className="w-8 h-8 text-slate-600" />
          )}

          {item.pageCount && (
            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono text-slate-300 backdrop-blur-xs">
              {item.pageCount}p
            </span>
          )}

          {/* Quick preview hover trigger if completed or loaded */}
          {item.status === 'completed' && (
            <button
              onClick={() => onPreview(item.id)}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition-opacity"
              title="Compare Before & After"
            >
              <Eye className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Info & Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4
              className="font-bold text-white text-sm sm:text-base truncate max-w-md"
              title={item.name}
            >
              {item.name}
            </h4>

            {item.status === 'completed' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Compressed
              </span>
            )}
          </div>

          {/* Sizes Comparison */}
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm mt-1.5">
            <span className="text-slate-400 font-mono">
              {formatBytes(item.originalSize)}
            </span>

            {item.compressedSize && (
              <>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span className="font-mono font-bold text-white">
                  {formatBytes(item.compressedSize)}
                </span>

                {savings && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-bold ${
                      savings.isReduction
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {savings.formatted}
                  </span>
                )}

                {item.durationMs && (
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {(item.durationMs / 1000).toFixed(1)}s
                  </span>
                )}
              </>
            )}
          </div>

          {/* Progress bar during compression */}
          {item.status === 'processing' && (
            <div className="mt-3 w-full">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-emerald-400 font-medium">Compressing...</span>
                <span className="text-emerald-400 font-mono">{item.progress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300 rounded-full"
                  style={{ width: `${item.progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {item.status === 'error' && (
            <div className="mt-2 text-xs text-rose-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{item.error || 'Failed to compress document'}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {item.status === 'idle' && (
            <button
              onClick={() => onCompress(item.id)}
              disabled={isAnyProcessing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Compress</span>
            </button>
          )}

          {item.status === 'completed' && (
            <>
              <button
                onClick={() => onPreview(item.id)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors border border-slate-700"
                title="Preview quality difference"
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Compare</span>
              </button>

              <button
                onClick={() => onDownload(item.id)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors shadow-md shadow-emerald-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </>
          )}

          {item.status === 'error' && (
            <button
              onClick={() => onCompress(item.id)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          )}

          <button
            onClick={() => onRemove(item.id)}
            disabled={item.status === 'processing'}
            className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Remove from queue"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

