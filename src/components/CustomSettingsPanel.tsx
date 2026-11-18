import React from 'react';
import { Sliders, X, Sparkles, HelpCircle, Layers, Image as ImageIcon, Palette, Shield } from 'lucide-react';
import { CompressionOptions } from '../types';

interface CustomSettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  options: CompressionOptions;
  onChange: (options: CompressionOptions) => void;
}

export const CustomSettingsPanel: React.FC<CustomSettingsPanelProps> = ({
  isOpen,
  onClose,
  options,
  onChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Custom Compression Settings</h3>
              <p className="text-xs text-slate-400">Fine-tune compression parameters for specific requirements</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-5 space-y-6 max-h-[70vh] overflow-y-auto pr-1">
          {/* Compression Mode */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              Engine Mode
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...options,
                    mode: 'smart',
                    preserveTextLayer: true,
                  })
                }
                className={`p-3 rounded-xl border text-left transition-all ${
                  options.mode === 'smart'
                    ? 'bg-purple-950/40 border-purple-500 text-white shadow-sm ring-1 ring-purple-500/40'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs text-slate-200">Smart Hybrid Mode</div>
                <div className="text-[11px] text-slate-400 mt-1 leading-tight">
                  Preserves vector text & selectable fonts. Recompresses images and deflates structural streams.
                </div>
              </button>

              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...options,
                    mode: 'scanned',
                    preserveTextLayer: false,
                  })
                }
                className={`p-3 rounded-xl border text-left transition-all ${
                  options.mode === 'scanned'
                    ? 'bg-purple-950/40 border-purple-500 text-white shadow-sm ring-1 ring-purple-500/40'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-xs text-slate-200">Scanned / Raster Mode</div>
                <div className="text-[11px] text-slate-400 mt-1 leading-tight">
                  Re-renders pages through canvas at custom DPI. Yields the highest compression for scanned files.
                </div>
              </button>
            </div>
          </div>

          {/* Image Quality Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                Image Quality ({Math.round(options.imageQuality * 100)}%)
              </label>
              <span className="text-xs font-mono font-bold text-purple-400">
                {options.imageQuality < 0.4
                  ? 'Low (High Compression)'
                  : options.imageQuality < 0.75
                  ? 'Balanced'
                  : 'High Fidelity'}
              </span>
            </div>
            <input
              type="range"
              min="0.15"
              max="0.95"
              step="0.05"
              value={options.imageQuality}
              onChange={(e) =>
                onChange({
                  ...options,
                  imageQuality: parseFloat(e.target.value),
                })
              }
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
              <span>15% (Smallest)</span>
              <span>55%</span>
              <span>95% (Crisp)</span>
            </div>
          </div>

          {/* Resolution / DPI Scale */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Resolution Scale ({options.scale.toFixed(2)}x)
              </label>
              <span className="text-xs font-mono font-bold text-purple-400">
                ~{Math.round(options.scale * 72)} DPI
              </span>
            </div>
            <input
              type="range"
              min="0.75"
              max="2.5"
              step="0.1"
              value={options.scale}
              onChange={(e) =>
                onChange({
                  ...options,
                  scale: parseFloat(e.target.value),
                })
              }
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
              <span>0.75x (~54 DPI)</span>
              <span>1.35x (~97 DPI)</span>
              <span>2.5x (~180 DPI)</span>
            </div>
          </div>

          {/* Toggles */}
          <div className="pt-2 border-t border-slate-800 space-y-3">
            {/* Grayscale */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800">
              <div className="flex items-start gap-2.5">
                <Palette className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-200">Convert to Grayscale</div>
                  <div className="text-[11px] text-slate-400">
                    Removes color channels. Massive size savings on receipts, bills, and monochrome scans.
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.grayscale}
                  onChange={(e) =>
                    onChange({
                      ...options,
                      grayscale: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {/* Remove Metadata */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800">
              <div className="flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-200">Strip Metadata & History</div>
                  <div className="text-[11px] text-slate-400">
                    Removes author name, creation software, edit timestamps, and hidden XML packets.
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.removeMetadata}
                  onChange={(e) =>
                    onChange({
                      ...options,
                      removeMetadata: e.target.checked,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-white text-xs transition-colors shadow-lg shadow-purple-600/30"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

