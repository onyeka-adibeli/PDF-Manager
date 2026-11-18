import React, { useRef, useState, useEffect, useCallback } from 'react';
import { UploadCloud, FilePlus, Sparkles, AlertCircle } from 'lucide-react';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFilesSelected, disabled }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (fileList: FileList | File[]) => {
      setErrorMessage(null);
      const validFiles: File[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          validFiles.push(file);
        }
      }

      if (validFiles.length === 0) {
        setErrorMessage('Please upload valid PDF documents (.pdf)');
        return;
      }

      onFilesSelected(validFiles);
    },
    [onFilesSelected]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      // Reset input value so same files can be selected again
      e.target.value = '';
    }
  };

  // Clipboard paste listener (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (disabled) return;
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const files: File[] = [];
        for (let i = 0; i < e.clipboardData.files.length; i++) {
          const file = e.clipboardData.files[i];
          if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            files.push(file);
          }
        }
        if (files.length > 0) {
          processFiles(files);
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [disabled, processFiles]);

  return (
    <div className="w-full max-w-5xl mx-auto mb-8">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer rounded-3xl p-8 sm:p-12 text-center transition-all duration-300 border-2 border-dashed ${
          isDragOver
            ? 'border-emerald-400 bg-emerald-950/20 scale-[1.008] shadow-2xl shadow-emerald-500/20 ring-4 ring-emerald-500/10'
            : 'border-slate-800 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700 hover:shadow-xl'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        {/* Ambient glow background */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent rounded-3xl pointer-events-none"></div>

        <div className="relative flex flex-col items-center justify-center">
          {/* Animated Icon */}
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 ${
              isDragOver
                ? 'scale-110 bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-400/40'
                : 'bg-slate-800/80 text-emerald-400 group-hover:scale-105 group-hover:bg-slate-800'
            }`}
          >
            <UploadCloud className="w-10 h-10" />
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mb-2">
            Drop your PDF files here
          </h3>

          <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
            Drag and drop single or multiple PDF documents, or click to browse files from your computer.
          </p>

          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all group-hover:shadow-emerald-500/40">
            <FilePlus className="w-4 h-4" />
            <span>Select PDF Files</span>
          </div>

          {/* Quick specs pill */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-8 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Batch Processing Supported
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Ctrl+V Paste Enabled
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              100% In-Browser Memory
            </span>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

