import React from 'react';
import { Sparkles, Download, Archive, Loader2, ArrowRight } from 'lucide-react';
import { FileItem } from '../types';
import { formatBytes, formatPercent } from '../lib/utils';

interface BatchActionBarProps {
  files: FileItem[];
  onCompressAll: () => void;
  onDownloadAllZip: () => void;
  isProcessing: boolean;
}

export const BatchActionBar: React.FC<BatchActionBarProps> = ({
  files,
  onCompressAll,
  onDownloadAllZip,
  isProcessing,
}) => {
  const completedFiles = files.filter((f) => f.status === 'completed');
  const idleFiles = files.filter((f) => f.status === 'idle' || f.status === 'error');

  const totalOriginalBytes = files.reduce((acc, f) => acc + f.originalSize, 0);
  const totalCompressedBytes = completedFiles.reduce(
    (acc, f) => acc + (f.compressedSize || f.originalSize),
    0
  );

  const completedOriginalBytes = completedFiles.reduce((acc, f) => acc + f.originalSize, 0);

  const overallSavings =
    completedOriginalBytes > 0 && totalCompressedBytes > 0
      ? formatPercent(completedOriginalBytes, totalCompressedBytes)
      : null;

  return (
    <div className="w-full max-w-5xl mx-auto mb-6 p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      {/* Metrics Summary */}
      <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs sm:text-sm">
        <div>
          <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">
            Documents
          </span>
          <span className="font-bold text-white text-base">
            {completedFiles.length} / {files.length} ready
          </span>
        </div>

        <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>

        <div>
          <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">
            Original Total
          </span>
          <span className="font-mono text-slate-300 font-bold text-base">
            {formatBytes(totalOriginalBytes)}
          </span>
        </div>

        {completedFiles.length > 0 && (
          <>
            <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>

            <div>
              <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">
                Compressed
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-emerald-400 font-bold text-base">
                  {formatBytes(totalCompressedBytes)}
                </span>
                {overallSavings && overallSavings.isReduction && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {overallSavings.formatted}
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
        {idleFiles.length > 0 && (
          <button
            onClick={onCompressAll}
            disabled={isProcessing}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Compressing Queue...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Compress All ({idleFiles.length})</span>
              </>
            )}
          </button>
        )}

        {completedFiles.length > 1 && (
          <button
            onClick={onDownloadAllZip}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all shadow-md"
          >
            <Archive className="w-4 h-4 text-emerald-400" />
            <span>Download All (.ZIP)</span>
          </button>
        )}
      </div>
    </div>
  );
};

