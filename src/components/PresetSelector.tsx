import React from 'react';
import { Zap, CheckCircle2, Sliders, Shield, FileCheck } from 'lucide-react';
import { CompressionPreset, PresetConfig } from '../types';
import { PRESET_CONFIGS } from '../lib/pdfCompressor';

interface PresetSelectorProps {
  currentPreset: CompressionPreset;
  onSelectPreset: (preset: CompressionPreset) => void;
  onOpenCustomSettings?: () => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  currentPreset,
  onSelectPreset,
  onOpenCustomSettings,
}) => {
  const presets = Object.values(PRESET_CONFIGS);

  return (
    <div className="w-full max-w-5xl mx-auto mb-8">
      <div className="flex items-center justify-between mb-3 px-1">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            Select Compression Level
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Choose how aggressively you want to compress your documents
          </p>
        </div>

        {currentPreset === 'custom' && onOpenCustomSettings && (
          <button
            onClick={onOpenCustomSettings}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 transition-all shadow-sm"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Customize Settings</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {presets.map((preset) => {
          const isSelected = currentPreset === preset.id;
          return (
            <div
              key={preset.id}
              onClick={() => {
                onSelectPreset(preset.id);
                if (preset.id === 'custom' && onOpenCustomSettings) {
                  onOpenCustomSettings();
                }
              }}
              className={`relative cursor-pointer rounded-2xl p-4 transition-all duration-200 border text-left flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900/90 border-emerald-500/80 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                  : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/70 hover:border-slate-700'
              }`}
            >
              {/* Top Tag & Check indicator */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                      isSelected
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700'
                    }`}
                  >
                    {preset.badge}
                  </span>

                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-emerald-500 text-slate-950 scale-100'
                        : 'border border-slate-700 bg-slate-950/40 text-transparent'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </div>

                <h3 className="font-bold text-white text-base tracking-tight">
                  {preset.label}
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {preset.tagline}
                </p>

                <p className="text-xs text-slate-400/90 mt-2.5 leading-relaxed line-clamp-3">
                  {preset.description}
                </p>
              </div>

              {/* Bottom savings badge */}
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">Est. reduction</span>
                <span
                  className={`font-mono font-bold ${
                    isSelected ? 'text-emerald-400' : 'text-slate-300'
                  }`}
                >
                  {preset.expectedSavings}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

