"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, X } from "lucide-react";

export function CookieBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    const acknowledged = localStorage.getItem("flowmacro_cookie_ack");
    if (!acknowledged) {
      // Small delay so it appears smoothly
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("flowmacro_cookie_ack", "true");
    setVisible(false);
  };

  if (!mounted || !visible) return null;

  return (
    <aside
      aria-label="Privacy and storage disclosure"
      className="fixed bottom-16 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-[#090d14]/95 backdrop-blur-xl border border-slate-800/90 rounded-xl p-4 shadow-2xl text-xs font-mono text-slate-300 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Zero-Cookie &amp; Privacy Notice</span>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss privacy notice"
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
          FlowMacro is built on a zero-backend architecture. We do not use advertising or cross-site tracking cookies.
          All macros, encryption keys, and DOM selectors are stored 100% locally on your device.
        </p>

        <div className="flex items-center justify-between gap-3 pt-1">
          <Link
            href="/privacy"
            className="text-[11px] text-slate-400 hover:text-emerald-400 underline underline-offset-2 transition-colors font-mono"
          >
            Privacy Specs
          </Link>
          <button
            onClick={handleDismiss}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shadow-sm"
          >
            Got it
          </button>
        </div>
      </div>
    </aside>
  );
}
