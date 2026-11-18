import React from 'react';
import { HelpCircle, Sparkles, Shield, Cpu } from 'lucide-react';

export const StatsFooter: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-900 bg-slate-950/90 py-12 px-4 sm:px-6 lg:px-8 mt-16 text-slate-400">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Unmatched Privacy</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unlike cloud-based compressors, your files are never transmitted to any third-party server. Everything executes locally inside your web browser.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Dual-Engine Compression</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Intelligent hybrid engine selects between structural deflation for vector/text documents and high-efficiency canvas rasterization for scanned files.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Deployable Anywhere</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Zero server dependencies or API costs. Deploy as a static site to Vercel, Netlify, Cloudflare Pages, or run completely offline as a PWA.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} PDF Squeeze — Private In-Browser Document Compression</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-400 transition-colors">Client-Side Architecture</span>
            <span>•</span>
            <span className="hover:text-slate-400 transition-colors">Vite + React + Tailwind</span>
            <span>•</span>
            <span className="hover:text-slate-400 transition-colors">PDF-lib & PDF.js</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

