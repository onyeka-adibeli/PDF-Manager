import React, { useState } from 'react';
import { Lock, Cpu, EyeOff, ShieldCheck, ChevronRight, X } from 'lucide-react';

export const PrivacyBanner: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full max-w-5xl mx-auto mb-8">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/20 p-4 sm:p-5 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                100% Private & In-Browser Processing
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Zero Cloud Upload
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Your PDF documents never touch an external server or database. All optimization runs strictly within your browser's local memory.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 shrink-0 px-3 py-1.5 rounded-lg bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 transition-colors"
          >
            <span>{isOpen ? 'Close details' : 'How it works'}</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {isOpen && (
          <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2.5">
              <Cpu className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-200">Local WebAssembly & Canvas</p>
                <p className="text-slate-400 mt-1">
                  Processes raster layers, stream deflation, and object trees locally using your device CPU.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2.5">
              <EyeOff className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-200">No Telemetry or Logging</p>
                <p className="text-slate-400 mt-1">
                  We cannot view, store, or intercept your documents, confidential contracts, or financial statements.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-200">Compliance Friendly</p>
                <p className="text-slate-400 mt-1">
                  Compliant with GDPR, HIPAA, and internal security policies because data transmission is zero.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

