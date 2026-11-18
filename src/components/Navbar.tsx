import React from 'react';
import {
  FileArchive,
  Minimize2,
  Layers,
  RefreshCw,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { AppTab } from '../types';

interface NavbarProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onReset?: () => void;
  hasFiles: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onReset,
  hasFiles,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-400/30">
            <FileArchive className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                PDF Squeeze
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                PRO
              </span>
            </div>
          </div>
        </div>

        {/* Center Mode Tabs */}
        <nav className="flex items-center rounded-xl bg-slate-900/90 p-1 border border-slate-800 shadow-inner">
          <button
            onClick={() => onTabChange('compress')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'compress'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Compress</span>
          </button>

          <button
            onClick={() => onTabChange('merge')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'merge'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Merge</span>
          </button>

          <button
            onClick={() => onTabChange('convert')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'convert'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Convert</span>
          </button>
        </nav>

        {/* Security / Privacy Badge & Reset */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-emerald-500/30 text-emerald-400 text-xs font-medium shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>100% In-Browser Privacy</span>
          </div>

          {hasFiles && activeTab === 'compress' && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Clear all files"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/40 border border-emerald-800/40 text-[11px] text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="hidden sm:inline">Offline Ready</span>
          </div>
        </div>
      </div>
    </header>
  );
};
