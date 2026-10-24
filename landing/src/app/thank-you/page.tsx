import React from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, Pin, Play, Terminal, ArrowRight, BookOpen, Layers, ShieldCheck, Star } from "lucide-react";

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-200 font-sans selection:bg-emerald-500/20 selection:text-emerald-300 flex flex-col justify-between antialiased bg-blueprint-matrix">
      {/* Header */}
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
            href="/docs"
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Open Documentation</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-14 text-center space-y-10">
        <div className="space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Installation Confirmed • Manifest V3 Active</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-mono">
            You&apos;re Ready to Automate.
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed font-mono">
            FlowMacro operates 100% locally in your browser. Follow these 3 quick steps to record your first zero-trust macro workflow:
          </p>
        </div>

        {/* 3 Step Getting Started Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left font-mono">
          {/* Step 1 */}
          <div className="p-5 rounded-xl border border-slate-800 bg-[#0d131f] space-y-3 relative group hover:border-emerald-500/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
              1
            </div>
            <h3 className="text-white text-sm font-semibold flex items-center gap-2">
              <Pin className="w-4 h-4 text-emerald-400" />
              Pin to Toolbar
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Click Chrome&apos;s puzzle icon (Extensions) in the top right, and click the pin icon next to FlowMacro for instant access.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-5 rounded-xl border border-slate-800 bg-[#0d131f] space-y-3 relative group hover:border-emerald-500/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
              2
            </div>
            <h3 className="text-white text-sm font-semibold flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              Launch IDE
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Click the FlowMacro icon to launch the dedicated standalone controller window that stays pinned beside your test tabs.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-5 rounded-xl border border-slate-800 bg-[#0d131f] space-y-3 relative group hover:border-emerald-500/40 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
              3
            </div>
            <h3 className="text-white text-sm font-semibold flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-400" />
              Hit Record
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Click Record, interact with any web app, and let the 5-tier waterfall capture resilient selectors with auto password encryption.
            </p>
          </div>
        </div>

        {/* Action Buttons & Review Prompt */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-[#0d131f] max-w-xl mx-auto space-y-4">
          <span className="text-xs font-mono text-slate-400 block">
            Have 10 seconds? Help an indie developer build momentum:
          </span>
          <a
            href="https://chromewebstore.google.com/detail/flowmacro-%E2%80%94-web-automatio/agehjimobcongfgkagfjhmlibkkmjppc/reviews"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Star className="w-4 h-4 fill-slate-950 text-slate-950" />
            <span>Leave a 5-Star Review on Chrome Web Store</span>
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#090d14] py-8 px-6 text-center text-xs font-mono text-slate-600">
        <span>© {new Date().getFullYear()} FlowMacro IDE • Built by Naveen Guru</span>
      </footer>
    </div>
  );
}
