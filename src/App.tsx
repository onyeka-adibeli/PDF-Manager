import React, { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { Navbar } from './components/Navbar';
import { PrivacyBanner } from './components/PrivacyBanner';
import { PresetSelector } from './components/PresetSelector';
import { CustomSettingsPanel } from './components/CustomSettingsPanel';
import { Dropzone } from './components/Dropzone';
import { FileCard } from './components/FileCard';
import { BatchActionBar } from './components/BatchActionBar';
import { PreviewModal } from './components/PreviewModal';
import { StatsFooter } from './components/StatsFooter';
import { MergeView } from './components/MergeView';
import { ConvertView } from './components/ConvertView';
import { FileItem, CompressionPreset, CompressionOptions, AppTab } from './types';
import { PRESET_CONFIGS, compressPDF } from './lib/pdfCompressor';
import { extractPDFInfo } from './lib/thumbnail';
import { generateCompressedFilename } from './lib/utils';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('compress');

  // Compress Tab States
  const [files, setFiles] = useState<FileItem[]>([]);
  const [preset, setPreset] = useState<CompressionPreset>('recommended');
  const [customOptions, setCustomOptions] = useState<CompressionOptions>({
    preset: 'recommended',
    mode: PRESET_CONFIGS.recommended.mode,
    imageQuality: PRESET_CONFIGS.recommended.imageQuality,
    scale: PRESET_CONFIGS.recommended.scale,
    grayscale: PRESET_CONFIGS.recommended.grayscale,
    removeMetadata: PRESET_CONFIGS.recommended.removeMetadata,
    preserveTextLayer: PRESET_CONFIGS.recommended.preserveTextLayer,
  });

  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [previewItemId, setPreviewItemId] = useState<string | null>(null);
  const [adHocPreviewItem, setAdHocPreviewItem] = useState<FileItem | null>(null);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);

  // Update options when preset changes
  const handleSelectPreset = (newPreset: CompressionPreset) => {
    setPreset(newPreset);
    if (newPreset !== 'custom') {
      const config = PRESET_CONFIGS[newPreset];
      setCustomOptions({
        preset: newPreset,
        mode: config.mode,
        imageQuality: config.imageQuality,
        scale: config.scale,
        grayscale: config.grayscale,
        removeMetadata: config.removeMetadata,
        preserveTextLayer: config.preserveTextLayer,
      });
    }
  };

  // Add new files from dropzone
  const handleFilesSelected = useCallback((newFiles: File[]) => {
    const newItems: FileItem[] = newFiles.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      originalSize: file.size,
      status: 'idle',
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...newItems]);

    // Asynchronously extract metadata & thumbnails
    newItems.forEach(async (item) => {
      try {
        const info = await extractPDFInfo(item.file);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? {
                  ...f,
                  pageCount: info.pageCount,
                  thumbnailUrl: info.thumbnailUrl,
                }
              : f
          )
        );
      } catch (err) {
        console.warn('Could not extract PDF thumbnail:', err);
      }
    });
  }, []);

  // Remove file
  const handleRemoveFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.compressedUrl) {
        URL.revokeObjectURL(target.compressedUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
  };

  // Reset all
  const handleReset = () => {
    files.forEach((f) => {
      if (f.compressedUrl) URL.revokeObjectURL(f.compressedUrl);
    });
    setFiles([]);
  };

  // Compress a single file
  const compressSingleFile = async (id: string, optionsToUse = customOptions) => {
    const fileItem = files.find((f) => f.id === id);
    if (!fileItem) return;

    setFiles((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, status: 'processing', progress: 5, error: undefined } : f
      )
    );

    try {
      const result = await compressPDF(fileItem.file, optionsToUse, (percent) => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === id
              ? {
                  ...f,
                  progress: percent,
                }
              : f
          )
        );
      });

      const url = URL.createObjectURL(result.blob);

      setFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                status: 'completed',
                progress: 100,
                compressedBlob: result.blob,
                compressedUrl: url,
                compressedSize: result.compressedSize,
                durationMs: result.durationMs,
                optionsUsed: optionsToUse,
              }
            : f
        )
      );
    } catch (err: any) {
      console.error('Compression error:', err);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                status: 'error',
                error: err?.message || 'Error occurred during compression',
              }
            : f
        )
      );
    }
  };

  // Compress all idle files in queue
  const handleCompressAll = async () => {
    if (isProcessingBatch) return;
    setIsProcessingBatch(true);

    const pendingFiles = files.filter((f) => f.status === 'idle' || f.status === 'error');

    for (const item of pendingFiles) {
      await compressSingleFile(item.id);
    }

    setIsProcessingBatch(false);
  };

  // Download single file
  const handleDownload = (id: string) => {
    // Check if ad-hoc preview item
    if (adHocPreviewItem && adHocPreviewItem.id === id) {
      const downloadUrl = URL.createObjectURL(adHocPreviewItem.file);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = adHocPreviewItem.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      return;
    }

    const item = files.find((f) => f.id === id);
    if (!item || !item.compressedBlob) return;

    const downloadUrl = item.compressedUrl || URL.createObjectURL(item.compressedBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = generateCompressedFilename(item.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Download all completed files as ZIP
  const handleDownloadAllZip = async () => {
    const completedFiles = files.filter((f) => f.status === 'completed' && f.compressedBlob);
    if (completedFiles.length === 0) return;

    const zip = new JSZip();

    completedFiles.forEach((item) => {
      if (item.compressedBlob) {
        const outName = generateCompressedFilename(item.name);
        zip.file(outName, item.compressedBlob);
      }
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipUrl = URL.createObjectURL(zipBlob);

    const link = document.createElement('a');
    link.href = zipUrl;
    link.download = `pdf_squeeze_bundle_${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(zipUrl);
  };

  // Preview an ad-hoc converted or merged PDF
  const handleAdHocPreview = (file: File, name: string) => {
    const adHocItem: FileItem = {
      id: `adhoc-${Date.now()}`,
      file,
      name,
      originalSize: file.size,
      status: 'completed',
      progress: 100,
    };
    setAdHocPreviewItem(adHocItem);
  };

  const previewItem =
    adHocPreviewItem || files.find((f) => f.id === previewItemId) || null;
  const isAnyProcessing = files.some((f) => f.status === 'processing') || isProcessingBatch;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Sticky Navigation with Mode Tabs */}
      <Navbar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onReset={handleReset}
        hasFiles={files.length > 0}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
        {/* Global Privacy Banner */}
        <PrivacyBanner />

        {/* TAB 1: COMPRESS PDF */}
        {activeTab === 'compress' && (
          <div className="animate-fade-in space-y-8">
            <div className="text-center max-w-3xl mx-auto mb-6">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-3 leading-tight">
                Compress PDFs securely in your browser{' '}
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  without uploading.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
                Reduce PDF file sizes by up to 90% while keeping text sharp. Guaranteed 100% private: all operations execute right inside your device's memory.
              </p>
            </div>

            {/* Presets */}
            <PresetSelector
              currentPreset={preset}
              onSelectPreset={handleSelectPreset}
              onOpenCustomSettings={() => setIsCustomModalOpen(true)}
            />

            {/* File Dropzone */}
            <Dropzone onFilesSelected={handleFilesSelected} disabled={isAnyProcessing} />

            {/* Batch Action Bar if files exist */}
            {files.length > 0 && (
              <BatchActionBar
                files={files}
                onCompressAll={handleCompressAll}
                onDownloadAllZip={handleDownloadAllZip}
                isProcessing={isProcessingBatch}
              />
            )}

            {/* Uploaded Files Queue */}
            {files.length > 0 && (
              <div className="w-full max-w-5xl mx-auto space-y-3">
                {files.map((item) => (
                  <FileCard
                    key={item.id}
                    item={item}
                    onCompress={(id) => compressSingleFile(id)}
                    onDownload={handleDownload}
                    onRemove={handleRemoveFile}
                    onPreview={(id) => setPreviewItemId(id)}
                    isAnyProcessing={isAnyProcessing}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MERGE PDF */}
        {activeTab === 'merge' && (
          <div className="animate-fade-in">
            <MergeView onPreviewMerged={handleAdHocPreview} />
          </div>
        )}

        {/* TAB 3: CONVERT TO PDF */}
        {activeTab === 'convert' && (
          <div className="animate-fade-in">
            <ConvertView onPreviewConverted={handleAdHocPreview} />
          </div>
        )}
      </main>

      {/* Custom Compression Settings Modal */}
      <CustomSettingsPanel
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        options={customOptions}
        onChange={(opts) => {
          setCustomOptions(opts);
          setPreset('custom');
        }}
      />

      {/* Interactive Quality Comparison Preview Modal */}
      <PreviewModal
        item={previewItem}
        isOpen={!!previewItem}
        onClose={() => {
          setPreviewItemId(null);
          setAdHocPreviewItem(null);
        }}
        onDownload={handleDownload}
      />

      {/* Footer */}
      <StatsFooter />
    </div>
  );
};
