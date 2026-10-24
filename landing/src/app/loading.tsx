import React from "react";
import { Terminal, RefreshCw } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-200 font-sans flex items-center justify-center p-6 bg-blueprint-matrix">
      <div className="max-w-md w-full bg-[#0d131f] border border-slate-800 rounded-xl p-6 shadow-2xl space-y-4 text-center font-mono">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>

        <div className="space-y-1.5">
          <div className="text-white text-sm font-semibold flex items-center justify-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Loading FlowMacro Resource...</span>
          </div>
          <p className="text-xs text-slate-500">
            Initializing client-side Manifest V3 sandbox
          </p>
        </div>

        <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
          <div className="h-full bg-emerald-400 rounded-full w-2/3 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
