"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquare,
  Mail,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ExternalLink,
  RotateCcw,
} from "lucide-react";

export default function UninstallFeedbackPage() {
  const [reason, setReason] = useState<string>("");
  const [website, setWebsite] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [submitted, setSubmitted] = useState<boolean>(false);

  const REASONS = [
    {
      id: "selector_failed",
      label: "Replay failed or couldn't find elements on my website",
      icon: AlertTriangle,
    },
    {
      id: "missing_format",
      label: "Missing an export format I needed (e.g. Cypress, Webhooks)",
      icon: HelpCircle,
    },
    {
      id: "too_complicated",
      label: "Too complicated / wasn't sure how to configure steps",
      icon: MessageSquare,
    },
    {
      id: "just_testing",
      label: "Just testing / curious about the extension",
      icon: CheckCircle2,
    },
    {
      id: "other",
      label: "Other reason",
      icon: MessageSquare,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    // Also craft email backup if user wants to send directly
    const subject = `FlowMacro Uninstall Feedback: ${reason || "Exit Survey"}`;
    const body = `Reason: ${reason}\nWebsite/Target: ${website}\nNotes: ${notes}\nUser Email: ${email}\n`;
    
    // Attempt non-blocking beacon if API route exists
    try {
      fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, website, notes, email, timestamp: new Date().toISOString() }),
      }).catch(() => {});
    } catch (err) {}
  };

  const handleOpenEmail = () => {
    const subject = encodeURIComponent(`FlowMacro Feedback: ${reason || "User Note"}`);
    const body = encodeURIComponent(
      `Hi Naveen,\n\nHere is why I uninstalled FlowMacro:\n\n• Reason: ${reason || "Not specified"}\n• Target Website: ${website || "N/A"}\n• Details: ${notes || "N/A"}\n\n`
    );
    window.open(`mailto:contact@naveensingh.guru?subject=${subject}&body=${body}`);
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-200 font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Bar */}
      <header className="border-b border-slate-800/80 bg-[#0b0f17]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>FlowMacro Home</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <span>FlowMacro Developer Feedback</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl mx-auto px-6 py-16">
        {submitted ? (
          <div className="p-8 rounded-2xl bg-zinc-900/60 border border-emerald-500/30 text-center space-y-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-white font-mono">Thank you for your honest feedback!</h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
              FlowMacro is actively built and maintained by a solo developer. Your notes will directly guide the next release's selector waterfall and exporter upgrades.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleOpenEmail}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send details directly to Naveen</span>
              </button>
              <a
                href="https://chromewebstore.google.com/detail/flowmacro-%E2%80%94-web-automatio/agehjimobcongfgkagfjhmlibkkmjppc"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-slate-200 text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Re-install from Web Store</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-white font-mono tracking-tight">
                We're sorry to see you go
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                FlowMacro is actively developed by Naveen Guru. If something broke or didn't meet your expectations, taking 15 seconds to tell us will directly help us fix it for other developers.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Reason Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-mono text-slate-300 font-semibold uppercase tracking-wider">
                  What was the main reason you uninstalled?
                </label>
                <div className="space-y-2">
                  {REASONS.map((item) => {
                    const Icon = item.icon;
                    const isSelected = reason === item.label;
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setReason(item.label)}
                        className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center gap-3 ${
                          isSelected
                            ? "bg-emerald-500/10 border-emerald-500/50 text-white shadow-sm"
                            : "bg-zinc-900/40 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-zinc-900/70"
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <span className="flex-1">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Target Website */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-slate-300 font-semibold uppercase tracking-wider">
                  Which website were you trying to automate? (Optional)
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="e.g. Supabase, Stripe, dynamic React table, internal portal..."
                  className="w-full bg-zinc-900/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Additional Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-slate-300 font-semibold uppercase tracking-wider">
                  Any additional feedback or missing features? (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tell us what felt clunky, what error occurred, or what feature would make you return..."
                  rows={3}
                  className="w-full bg-zinc-900/60 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 resize-none"
                />
              </div>

              {/* Email (Optional) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-slate-300 font-semibold uppercase tracking-wider">
                  Your email if you'd like a follow-up or bug fix (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full bg-zinc-900/60 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="submit"
                  disabled={!reason}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white text-xs font-medium transition-colors shadow-lg shadow-emerald-950/40"
                >
                  Submit Exit Feedback
                </button>
                <button
                  type="button"
                  onClick={handleOpenEmail}
                  className="text-xs text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 font-mono"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>Email Naveen directly</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
