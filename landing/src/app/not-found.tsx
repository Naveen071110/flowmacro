import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Terminal, AlertOctagon, Compass, BookOpen, Layers } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-200 font-sans selection:bg-emerald-500/20 selection:text-emerald-300 flex flex-col justify-between antialiased bg-blueprint-matrix">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-[#090d14]/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image
              src="/flowmacro_store_icon_128x128.png"
              alt="FlowMacro Logo"
              width={28}
              height={28}
              className="rounded group-hover:scale-105 transition-transform"
            />
            <span className="font-bold text-white tracking-tight group-hover:text-emerald-400 transition-colors font-mono">
              FlowMacro IDE
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </Link>
        </div>
      </header>

      {/* Main 404 Content */}
      <main className="max-w-3xl mx-auto px-6 py-16 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
          <AlertOctagon className="w-3.5 h-3.5" />
          <span>Error 404 • Execution Target Missing</span>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight font-mono">
            DOM Node <span className="text-emerald-400">Not Found</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed font-mono">
            The route or resource you attempted to automate does not exist in this DOM tree. It may have been moved, renamed, or garbage collected.
          </p>
        </div>

        {/* Terminal Trace Box */}
        <div className="max-w-xl mx-auto bg-[#090d14] border border-slate-800 rounded-xl p-4 text-left font-mono text-xs text-slate-400 space-y-1.5 shadow-2xl">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80 text-slate-500 text-[11px]">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>replayer_console.log — Waterfall Fail Trace</span>
          </div>
          <div className="text-red-400/90 pt-1">
            [14:02:19.404] [FAIL] Target URL resolution returned 404 (Not Found)
          </div>
          <div className="text-slate-500">
            [14:02:19.408] [INFO] Tier 1 to Tier 5 locator cascade exhausted
          </div>
          <div className="text-emerald-400/80">
            [14:02:19.412] [RECOVERY] Recommended: Navigate back to safe root coordinates
          </div>
        </div>

        {/* Quick Links Recovery Hub */}
        <div className="space-y-3 pt-4">
          <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
            Quick Recovery Coordinates
          </span>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-mono font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>Back to Main IDE</span>
            </Link>
            <Link
              href="/docs"
              className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium transition-colors border border-slate-700 flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Documentation</span>
            </Link>
            <Link
              href="/tools/side-to-playwright"
              className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium transition-colors border border-slate-700 flex items-center gap-2"
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>.side to Playwright Converter</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#090d14] py-6 px-6 text-center text-xs font-mono text-slate-600">
        <span>FlowMacro IDE • Local Manifest V3 Automation Engine</span>
      </footer>
    </div>
  );
}
