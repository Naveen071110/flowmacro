"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  BookOpen,
  ShieldCheck,
  Lock,
  Layers,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Mail,
  Github,
  ExternalLink,
  Code2,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Database,
  ServerOff,
  Cpu,
  Check,
  FileCode,
  Search,
  Key,
  Clock,
  Compass,
  Workflow,
  ShieldAlert,
  Boxes,
  Sliders,
  Filter,
} from "lucide-react";

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/flowmacro-%E2%80%94-web-automatio/agehjimobcongfgkagfjhmlibkkmjppc?hl=en-US&utm_source=ext_sidebar";

interface Category {
  id: string;
  name: string;
  icon: any;
  count: number;
}

const CATEGORIES: Category[] = [
  { id: "all", name: "All Topics", icon: BookOpen, count: 8 },
  { id: "architecture", name: "Architecture", icon: ServerOff, count: 2 },
  { id: "quickstart", name: "Quick Start", icon: Compass, count: 3 },
  { id: "selectors", name: "DOM & Selectors", icon: Layers, count: 4 },
  { id: "security", name: "Security Vault", icon: Lock, count: 3 },
  { id: "troubleshooting", name: "Troubleshooting", icon: AlertTriangle, count: 5 },
  { id: "exporters", name: "Code Exporters", icon: Code2, count: 4 },
  { id: "reference", name: "Command Reference", icon: Sliders, count: 2 },
  { id: "support", name: "Support & Help", icon: Mail, count: 2 },
];

export default function DocsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const isVisible = (categoryId: string, keywords: string) => {
    const matchesCategory = selectedCategory === "all" || selectedCategory === categoryId;
    const matchesSearch =
      searchQuery.trim() === "" ||
      keywords.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-200 font-sans selection:bg-emerald-500/20 selection:text-emerald-300 antialiased bg-blueprint-matrix">
      {/* 1. TOP STICKY NAVIGATION BAR */}
      <header className="border-b border-slate-800/80 bg-[#0b0f17]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to FlowMacro IDE</span>
            </Link>

            <div className="h-4 w-px bg-slate-800 hidden sm:block" />

            <div className="hidden sm:flex items-center gap-2">
              <Image
                src="/flowmacro_store_icon_128x128.png"
                alt="FlowMacro Logo"
                width={22}
                height={22}
                className="rounded"
              />
              <span className="text-xs font-mono font-bold text-white tracking-wide">
                FlowMacro Docs &amp; Reference
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                v1.0.3
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://github.com/Naveen071110/flowmacro/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-slate-800 bg-[#0f172a]"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub Issues</span>
            </a>

            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 px-3.5 py-1.5 rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] active:scale-95"
            >
              <span>Add to Chrome (Free)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </header>

      {/* 2. HERO SEARCH & CLASSIFICATION BANNER */}
      <section className="py-14 px-6 border-b border-slate-800/80 bg-gradient-to-b from-[#0e1626] to-[#0b0f17]">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5" />
            <span>CLASSIFIED DOCUMENTATION &amp; TROUBLESHOOTING</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white font-mono">
            FlowMacro Knowledge Base
          </h1>

          <p className="text-xs md:text-sm text-slate-400 max-w-2xl mx-auto font-sans leading-relaxed">
            Organized architecture guides, selector waterfall specifications, zero-trust cryptographic secrets, and pragmatic fixes for real-world automation edge cases.
          </p>

          {/* Real-time search filter input */}
          <div className="pt-4 max-w-xl mx-auto relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3.5 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search topics: Clerk auth, shadow DOM, 6000ms timeout, Playwright, AES-256..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#070a0f] border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 text-xs font-mono text-slate-500 hover:text-slate-300"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs Pill Bar */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-2 font-mono text-xs">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all ${
                    isActive
                      ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-sm font-semibold"
                      : "bg-[#0f172a] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. MAIN CLASSIFIED CONTENT CONTAINER */}
      <main className="max-w-5xl mx-auto px-6 py-14 space-y-16">

        {/* =========================================================================
            SECTION 1: ARCHITECTURE & ZERO-BACKEND SPEC
            ========================================================================= */}
        {isVisible("architecture", "architecture components manifest v3 background service worker local storage privacy") && (
          <section id="architecture" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center">
                01
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold block">
                  Category: System Design
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-white font-mono">
                  System Architecture &amp; Zero-Backend Engine
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-mono text-xs">
              <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>1. Dedicated IDE Controller</span>
                </div>
                <p className="text-slate-400 font-sans leading-relaxed">
                  Opens as an isolated 960 &times; 750px window via <code className="text-slate-300 bg-slate-900 px-1 py-0.5 rounded">chrome.windows.create(popup)</code>. Controls target browser tabs via message passing without injecting heavy UI frames into target websites.
                </p>
                <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-800/80">
                  Focus: Zero DOM interference with target app
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>2. Manifest V3 Service Worker</span>
                </div>
                <p className="text-slate-400 font-sans leading-relaxed">
                  Operates with dual-tier state persistence (<code className="text-slate-300 bg-slate-900 px-1 py-0.5 rounded">chrome.storage.session</code> &amp; <code className="text-slate-300 bg-slate-900 px-1 py-0.5 rounded">chrome.storage.local</code>). Survives browser service worker suspension and rehydrates execution seamlessly.
                </p>
                <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-800/80">
                  Lifecycle: Rehydration on every message &amp; tab update
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>3. 100% Client-Side Storage</span>
                </div>
                <p className="text-slate-400 font-sans leading-relaxed">
                  Recorded workflows, test suites, and cryptographic keys remain strictly on your local device. FlowMacro does not operate any remote database, proxy servers, or third-party telemetry beacons.
                </p>
                <div className="pt-2 text-[11px] text-emerald-400 border-t border-slate-800/80">
                  Compliance: Zero cloud exposure, GDPR/HIPAA-safe
                </div>
              </div>
            </div>

            {/* Permission Specs Table */}
            <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 font-mono text-xs space-y-3">
              <h4 className="text-white font-bold text-sm">Manifest V3 Permission Declarations:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div className="p-2.5 rounded bg-[#0b0f17] border border-slate-800">
                  <code className="text-emerald-400">activeTab &amp; tabs</code>: Attaches recorder/replayer content scripts into the specific tab you target.
                </div>
                <div className="p-2.5 rounded bg-[#0b0f17] border border-slate-800">
                  <code className="text-emerald-400">scripting</code>: Dynamically injects <code className="text-slate-300">recorder.js</code> and <code className="text-slate-300">replayer.js</code> upon page navigation.
                </div>
                <div className="p-2.5 rounded bg-[#0b0f17] border border-slate-800">
                  <code className="text-emerald-400">storage &amp; session</code>: Persists your test suites and active recording heads locally across reloads.
                </div>
                <div className="p-2.5 rounded bg-[#0b0f17] border border-slate-800">
                  <code className="text-emerald-400">webNavigation</code>: Detects top-level redirects and hash transitions (<code className="text-slate-300">#/factor-one</code>) to re-attach listeners.
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            SECTION 2: QUICK START GUIDE
            ========================================================================= */}
        {isVisible("quickstart", "quick start guide recording replay hotkeys controls base url") && (
          <section id="quickstart" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center">
                02
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold block">
                  Category: Getting Started
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-white font-mono">
                  Quick Start: Your First Automation in 60s
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-mono font-bold text-xs">
                  <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span>Open Controller Window</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Click the FlowMacro icon in your Chrome toolbar or hit <strong className="text-emerald-400 font-mono">Alt + Shift + R</strong>. The standalone controller window launches and establishes connection with your browser tab.
                </p>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-slate-400">
                  Controller size: 960 &times; 750px popup
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-mono font-bold text-xs">
                  <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                    2
                  </span>
                  <span>Specify URL &amp; Record</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Enter your target starting URL in the <strong className="text-slate-300 font-mono">BASE_URL</strong> field and click <strong className="text-rose-400 font-mono">Record</strong>. Navigate and click elements naturally. Actions stream into the table in real time.
                </p>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-emerald-400">
                  Passwords masked automatically in memory
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-white font-mono font-bold text-xs">
                  <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                    3
                  </span>
                  <span>Replay, Tune &amp; Export</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Hit <strong className="text-slate-300 font-mono">Stop</strong> when finished. Click <strong className="text-emerald-400 font-mono">Replay Macro</strong> to test execution at 0.5x, 1x, or 2x speed. Export to Playwright (TS), Puppeteer (JS), or Python Selenium.
                </p>
                <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-slate-400">
                  Green outline confirms target element
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 font-mono text-xs text-emerald-300 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Pro-Tip for Fast Iteration:</strong> You can click any step in the IDE table and click <strong>&quot;Play from here&quot;</strong> to resume execution from a specific step without having to replay the entire macro from the beginning.
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            SECTION 3: 5-TIER SELECTOR WATERFALL & DOM ENGINE
            ========================================================================= */}
        {isVisible("selectors", "selectors 5-tier waterfall shadow dom iframe composedpath testid aria regex clean css xpath") && (
          <section id="selectors" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center">
                03
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold block">
                  Category: Core Automation Engine
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-white font-mono">
                  The 5-Tier Selector Waterfall &amp; DOM Piercing
                </h2>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[#0f172a] border border-slate-800 space-y-6 font-mono text-xs">
              <p className="text-slate-300 leading-relaxed font-sans">
                Most web recorders fail in production because they rely on fragile CSS selectors like <code className="text-slate-400 bg-slate-900 px-1 py-0.5 rounded">div.css-19f8x &gt; button.btn-3a</code>. FlowMacro resolves this with an intelligent multi-tier locator hierarchy evaluated at capture time:
              </p>

              <div className="space-y-3 font-mono">
                {/* Tier 0: Shadow DOM */}
                <div className="p-4 rounded-lg bg-[#0b0f17] border border-cyan-500/30 flex items-start gap-3">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[11px] font-bold shrink-0">
                    Tier 0
                  </span>
                  <div>
                    <h4 className="text-white font-bold">Open Shadow DOM Piercing (composedPath)</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5 font-sans">
                      Uses <code className="text-cyan-300 font-mono">composedPath()</code> and recursive shadow host inspection. When an element lives inside a Web Component shadow root, FlowMacro emits deep piercing locators like <code className="text-cyan-300 font-mono">shadow=host-component &gt;&gt;&gt; inner-button</code>.
                    </p>
                  </div>
                </div>

                {/* Tier 1: Test IDs */}
                <div className="p-4 rounded-lg bg-[#0b0f17] border border-emerald-500/30 flex items-start gap-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[11px] font-bold shrink-0">
                    Tier 1
                  </span>
                  <div>
                    <h4 className="text-white font-bold">QA &amp; Test Attributes (data-testid)</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5 font-sans">
                      Checks for <code className="text-emerald-300 font-mono">data-testid</code>, <code className="text-emerald-300 font-mono">data-test</code>, <code className="text-emerald-300 font-mono">data-cy</code>, and <code className="text-emerald-300 font-mono">data-qa</code>. Resilient against any styling or DOM tree redesign.
                    </p>
                  </div>
                </div>

                {/* Tier 2: Dynamic ID Filtering */}
                <div className="p-4 rounded-lg bg-[#0b0f17] border border-blue-500/30 flex items-start gap-3">
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[11px] font-bold shrink-0">
                    Tier 2
                  </span>
                  <div>
                    <h4 className="text-white font-bold">Semantic ID Filter (Regex Discard Engine)</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5 font-sans">
                      Employs regex filters to eliminate autogenerated framework IDs like <code className="text-slate-500 font-mono">:r0:</code> (React 18), <code className="text-slate-500 font-mono">ember1284</code>, <code className="text-slate-500 font-mono">radix-id-12</code>, and 4+ digit numeric hashes, preserving only stable IDs like <code className="text-blue-300 font-mono">#identifier-field</code>.
                    </p>
                  </div>
                </div>

                {/* Tier 3: ARIA & Roles */}
                <div className="p-4 rounded-lg bg-[#0b0f17] border border-purple-500/30 flex items-start gap-3">
                  <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[11px] font-bold shrink-0">
                    Tier 3
                  </span>
                  <div>
                    <h4 className="text-white font-bold">Semantic ARIA &amp; Accessible Roles</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5 font-sans">
                      Captures <code className="text-purple-300 font-mono">[aria-label=&quot;Sign In&quot;]</code>, <code className="text-purple-300 font-mono">[role=&quot;button&quot;]</code>, and input <code className="text-purple-300 font-mono">[placeholder=&quot;...&quot;]</code>.
                    </p>
                  </div>
                </div>

                {/* Tier 4: Semantic Element Locators */}
                <div className="p-4 rounded-lg bg-[#0b0f17] border border-amber-500/30 flex items-start gap-3">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[11px] font-bold shrink-0">
                    Tier 4
                  </span>
                  <div>
                    <h4 className="text-white font-bold">Semantic Element &amp; Button Text</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5 font-sans">
                      Generates text-based locators such as <code className="text-amber-300 font-mono">xpath=//button[normalize-space()=&quot;Continue&quot;]</code> or <code className="text-amber-300 font-mono">css=button[type=&quot;submit&quot;]</code>.
                    </p>
                  </div>
                </div>

                {/* Tier 5: Sanitized CSS & XPath */}
                <div className="p-4 rounded-lg bg-[#0b0f17] border border-slate-700 flex items-start gap-3">
                  <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-[11px] font-bold shrink-0">
                    Tier 5
                  </span>
                  <div>
                    <h4 className="text-white font-bold">Sanitized CSS &amp; Structural XPath Fallback</h4>
                    <p className="text-slate-400 text-[11px] mt-0.5 font-sans">
                      Generates hierarchical CSS with automatic emoji stripping (removing Clerk&apos;s <code className="text-slate-400 font-mono">.🔒️</code> classes) and standard structural XPath as a final resilience layer.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cross-Origin Iframe Routing Card */}
              <div className="p-4 rounded-lg bg-[#0b0f17] border border-emerald-500/30 flex items-start gap-3 text-xs">
                <Boxes className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Cross-Origin Iframe Routing:</strong> FlowMacro tracks the exact <code className="text-emerald-300 font-mono">frameId</code> from message senders. Commands recorded inside embedded payment frames (Stripe, PayPal) dispatch directly into the matching frame during replay.
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            SECTION 4: ZERO-TRUST AES-256 VAULT
            ========================================================================= */}
        {isVisible("security", "security vault aes-256 gcm web crypto passwords masked secret credentials") && (
          <section id="security" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center">
                04
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold block">
                  Category: Security &amp; Compliance
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-white font-mono">
                  Zero-Trust Credential &amp; Secret Vault
                </h2>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[#0f172a] border border-slate-800 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-xs">
                <div className="p-4 rounded-lg bg-[#0b0f17] border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-bold">
                    <span>Brittle / Legacy Macro Tools</span>
                  </div>
                  <p className="text-slate-400 font-sans text-xs leading-relaxed">
                    Hardcode plain-text passwords into exported JSON files or scripts. Committing these files to Git or sharing them with teammates creates instant credential leak vulnerabilities.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[#0b0f17] border border-emerald-500/40 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>FlowMacro In-Memory Vault</span>
                  </div>
                  <p className="text-slate-400 font-sans text-xs leading-relaxed">
                    Masks sensitive fields as <code className="text-emerald-300 bg-emerald-500/10 px-1 py-0.5 rounded font-mono">&#123;&#123;SECRET_PASSWORD&#125;&#125;</code> and encrypts secrets in memory via native <strong className="text-white">AES-256-GCM (Web Crypto API)</strong>.
                  </p>
                </div>
              </div>

              {/* Technical Implementation Breakdown */}
              <div className="space-y-3 font-mono text-xs">
                <h4 className="text-white font-bold text-sm">How Cryptographic Secrets Work Under the Hood:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                  <div className="p-3 rounded-lg bg-[#0b0f17] border border-slate-800">
                    <strong className="text-slate-200 block mb-1">1. Detection</strong>
                    <span className="text-slate-400">
                      Detects <code className="text-slate-300">type=&quot;password&quot;</code>, <code className="text-slate-300">autocomplete=&quot;current-password&quot;</code>, and inputs with tokens like <code className="text-slate-300">secret|token|api_key</code>.
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0b0f17] border border-slate-800">
                    <strong className="text-slate-200 block mb-1">2. 96-bit Nonce GCM</strong>
                    <span className="text-slate-400">
                      Generates a cryptographically random 96-bit initialization vector (<code className="text-slate-300">crypto.getRandomValues</code>) with client-side 256-bit symmetric keys.
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0b0f17] border border-slate-800">
                    <strong className="text-slate-200 block mb-1">3. CI/CD Environment Export</strong>
                    <span className="text-slate-400">
                      Exports generate clean references to <code className="text-emerald-300">process.env.AUTO_MACRO_PASSWORD</code> so tests execute headlessly in GitHub Actions with zero leaks.
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-[#090d14] border border-slate-800 text-xs overflow-x-auto text-slate-300 mt-2">
                  <pre>{`// Secure Playwright Export - Zero Hardcoded Passwords
const AUTO_MACRO_PASSWORD = process.env.AUTO_MACRO_PASSWORD || '';

// Step: TYPE id=password-field
await page.locator("#password-field").fill(AUTO_MACRO_PASSWORD);`}</pre>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            SECTION 5: TROUBLESHOOTING & EDGE CASES
            ========================================================================= */}
        {isVisible("troubleshooting", "troubleshooting errors timeout 6000ms multi-step auth clerk supabase nextauth ghost submit wait inspector") && (
          <section id="troubleshooting" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center">
                05
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold block">
                  Category: Problem Solving
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-white font-mono">
                  Troubleshooting &amp; Real-World Edge Cases
                </h2>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[#0f172a] border border-slate-800 space-y-6 text-xs font-mono">
              <p className="text-slate-300 leading-relaxed font-sans">
                Real-world web applications (especially modern authentication providers like Clerk, Supabase, Auth0, and NextAuth) introduce dynamic DOM states. Here is how to diagnose and resolve each scenario:
              </p>

              <div className="space-y-5">
                {/* Issue 1: Ghost Submit Steps in Clerk / Two-Screen Login */}
                <div className="p-4 rounded-lg bg-[#0b0f17] border border-amber-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Edge Case 1: Two-Screen Login Forms &amp; Ghost &quot;SUBMIT&quot; Steps</span>
                  </div>
                  <p className="text-slate-300 font-sans leading-relaxed">
                    Modern auth widgets split sign-in across two screens (Screen 1: enter email &rarr; click Continue &rarr; Screen 2: enter password &rarr; click Sign In). When clicking &quot;Continue&quot;, form libraries often emit both a button click and a form submit, recording redundant <code className="text-slate-200">SUBMIT</code> steps before Screen 2 appears.
                  </p>
                  <div className="p-3.5 rounded bg-slate-900 border border-slate-800 text-emerald-300 space-y-2">
                    <strong className="text-white">The Clean Solution:</strong>
                    <p className="text-slate-300 font-sans">
                      In the FlowMacro IDE table, review your recorded steps. Simply click the <strong>Trash icon</strong> on any ghost <code className="text-slate-200">SUBMIT</code> steps between the username click and the password input. A clean multi-step flow should look like:
                    </p>
                    <div className="p-2.5 rounded bg-slate-950 font-mono text-[11px] text-slate-300 space-y-1">
                      <div>1. TYPE: id=identifier-field (e.g. username/email)</div>
                      <div>2. CLICK: button.cl-formButtonPrimary (Continue)</div>
                      <div>3. TYPE: id=password-field (&#123;&#123;SECRET_PASSWORD&#125;&#125;)</div>
                      <div>4. CLICK: button.cl-formButtonPrimary (Sign In)</div>
                    </div>
                  </div>
                </div>

                {/* Issue 2: 6000ms Timeout Error */}
                <div className="p-4 rounded-lg bg-[#0b0f17] border border-rose-500/40 space-y-3">
                  <div className="flex items-center gap-2 text-rose-400 font-bold">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>Edge Case 2: &quot;Target not found in DOM within 6000ms&quot;</span>
                  </div>
                  <p className="text-slate-300 font-sans leading-relaxed">
                    Occurs when an element takes longer than 6 seconds to render due to network latency, lazy chunk loading, or modal transitions.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-sans text-xs pt-1">
                    <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1">
                      <strong className="text-white font-mono text-[11px]">Fix A: Switch Waterfall Selector</strong>
                      <p className="text-slate-400 text-[11px]">
                        Click the failed step in the table. In the Command Inspector, switch from the CSS path to an alternate <strong>ARIA locator</strong> or <strong>ID</strong>.
                      </p>
                    </div>
                    <div className="p-3 rounded bg-slate-900 border border-slate-800 space-y-1">
                      <strong className="text-white font-mono text-[11px]">Fix B: Add a Brief Pause Step</strong>
                      <p className="text-slate-400 text-[11px]">
                        Click <strong>+ Add Step</strong> in the IDE and choose <code className="text-emerald-300 font-mono">wait</code> (e.g. 1500ms) right before the slow element to give the SPA time to render.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Issue 3: Reordering and Modifying Steps */}
                <div className="p-4 rounded-lg bg-[#0b0f17] border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2 text-white font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Edge Case 3: Reordering or Updating Recorded Steps</span>
                  </div>
                  <p className="text-slate-300 font-sans leading-relaxed">
                    Never discard an entire recording if you clicked something by accident. Use the <strong>&uarr; Up</strong> and <strong>&darr; Down</strong> arrows on any step row to reorder actions, or select a step to adjust its command type, selector, or value directly in the Command Inspector.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            SECTION 6: CODE EXPORTERS & CI/CD PIPELINES
            ========================================================================= */}
        {isVisible("exporters", "code exporters playwright puppeteer python selenium side json ci/cd github actions") && (
          <section id="exporters" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center">
                06
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold block">
                  Category: Integration &amp; CI/CD
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-white font-mono">
                  Multi-Framework Code Exporters &amp; CI/CD
                </h2>
              </div>
            </div>

            <div className="p-6 rounded-xl bg-[#0f172a] border border-slate-800 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
                <div className="p-4 rounded-lg bg-[#0b0f17] border border-slate-800 space-y-1">
                  <div className="text-emerald-400 font-bold">Playwright (TS)</div>
                  <p className="text-slate-400 text-[11px] font-sans">
                    Async TypeScript tests with <code className="text-slate-300">page.locator()</code> and environment variables.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[#0b0f17] border border-slate-800 space-y-1">
                  <div className="text-emerald-400 font-bold">Puppeteer (JS)</div>
                  <p className="text-slate-400 text-[11px] font-sans">
                    Vanilla Node.js scripts for headless scraping and browser workflow verification.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[#0b0f17] border border-slate-800 space-y-1">
                  <div className="text-emerald-400 font-bold">Python Selenium</div>
                  <p className="text-slate-400 text-[11px] font-sans">
                    WebDriver scripts utilizing <code className="text-slate-300">WebDriverWait</code> and ChromeOptions.
                  </p>
                </div>

                <div className="p-4 rounded-lg bg-[#0b0f17] border border-slate-800 space-y-1">
                  <div className="text-emerald-400 font-bold">Selenium IDE (.side)</div>
                  <p className="text-slate-400 text-[11px] font-sans">
                    Interchangeable JSON schema compatible with Selenium IDE runners.
                  </p>
                </div>
              </div>

              {/* GitHub Actions CI Configuration Recipe */}
              <div className="space-y-3 font-mono text-xs">
                <h4 className="text-white font-bold">Automated CI/CD Workflow (.github/workflows/playwright.yml):</h4>
                <div className="p-4 rounded-lg bg-[#090d14] border border-slate-800 text-xs overflow-x-auto text-slate-300">
                  <pre>{`name: FlowMacro Playwright CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test
        env:
          AUTO_MACRO_PASSWORD: \${{ secrets.AUTO_MACRO_PASSWORD }}`}</pre>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            SECTION 7: COMMAND & KEYBOARD SHORTCUTS REFERENCE
            ========================================================================= */}
        {isVisible("reference", "reference commands open click type select submit waitfor wait shortcuts hotkeys ctrl+z") && (
          <section id="reference" className="scroll-mt-24 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center">
                07
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-semibold block">
                  Category: Developer Quick Reference
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-white font-mono">
                  Command &amp; Keyboard Shortcuts Reference
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 font-mono text-xs">
              {/* Commands Reference Table */}
              <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-4">
                <h4 className="text-white font-bold text-sm flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-400" />
                  <span>Supported Selenium Commands</span>
                </h4>
                <div className="divide-y divide-slate-800 text-[11px]">
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-blue-400 font-bold">open</span>
                    <span className="text-slate-400">Navigates to URL &amp; waits for DOM ready</span>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-amber-400 font-bold">click</span>
                    <span className="text-slate-400">Clicks target element (with 5-tier fallback)</span>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-purple-400 font-bold">type</span>
                    <span className="text-slate-400">Inputs text value (auto-masked if sensitive)</span>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-teal-400 font-bold">select</span>
                    <span className="text-slate-400">Selects dropdown option (label= or value=)</span>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-emerald-400 font-bold">submit</span>
                    <span className="text-slate-400">Submits parent form or triggers Enter</span>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-cyan-400 font-bold">waitFor</span>
                    <span className="text-slate-400">Polls until target element becomes visible</span>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-zinc-400 font-bold">wait</span>
                    <span className="text-slate-400">Fixed duration delay (e.g. 1500ms)</span>
                  </div>
                </div>
              </div>

              {/* Keyboard Shortcuts Table */}
              <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-4">
                <h4 className="text-white font-bold text-sm flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-400" />
                  <span>IDE Keyboard Shortcuts</span>
                </h4>
                <div className="divide-y divide-slate-800 text-[11px]">
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-slate-200">Undo Action</span>
                    <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-emerald-400">Ctrl + Z</kbd>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-slate-200">Redo Action</span>
                    <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-emerald-400">Ctrl + Y / Ctrl + Shift + Z</kbd>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-slate-200">New Test Suite</span>
                    <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-emerald-400">Ctrl + N</kbd>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-slate-200">Open / Import JSON Suite</span>
                    <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-emerald-400">Ctrl + O</kbd>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-slate-200">Open Code Export Modal</span>
                    <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-emerald-400">Ctrl + E</kbd>
                  </div>
                  <div className="py-2 flex items-center justify-between">
                    <span className="text-slate-200">Launch Controller IDE</span>
                    <kbd className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-emerald-400">Alt + Shift + R</kbd>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================================
            SECTION 8: DIRECT DEVELOPER SUPPORT & ISSUES
            ========================================================================= */}
        {isVisible("support", "support help contact email naveen issue bug feedback report") && (
          <section id="support" className="scroll-mt-24 space-y-6">
            <div className="p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0e1726] to-slate-900 border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Mail className="w-7 h-7" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 mb-2">
                    <span>Direct Developer Assistance</span>
                  </div>
                  <h3 className="text-xl font-bold text-white font-mono">
                    Need Help or Found an Edge-Case Website?
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-xl font-sans">
                    Have an unusual form, shadow DOM obstacle, or feature request? We actively monitor support inquiries and provide hands-on assistance.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full md:w-auto font-mono text-xs">
                <a
                  href="mailto:contact@naveensingh.guru?subject=FlowMacro%20Support%20%2F%20Issue"
                  className="w-full sm:w-auto px-5 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 active:scale-95"
                >
                  <Mail className="w-4 h-4" />
                  <span>contact@naveensingh.guru</span>
                </a>

                <a
                  href="https://github.com/Naveen071110/flowmacro/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-all border border-slate-700 flex items-center justify-center gap-2 active:scale-95"
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub Issues</span>
                </a>
              </div>
            </div>
          </section>
        )}

      </main>

      {/* 4. FOOTER */}
      <footer className="border-t border-slate-800/80 bg-[#090d14] py-12 px-6 text-xs font-mono text-slate-500">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-slate-800/60">
            {/* Col 1: Brand */}
            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center gap-2.5 text-slate-300">
                <Image
                  src="/flowmacro_store_icon_128x128.png"
                  alt="FlowMacro IDE Logo"
                  width={24}
                  height={24}
                  className="rounded"
                />
                <span className="text-white font-bold text-sm tracking-tight">FlowMacro</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px]">
                  Manifest V3
                </span>
              </div>
              <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
                Classified technical documentation & guides for FlowMacro IDE. Record workflows with 5-tier selectors and local AES-256 password encryption.
              </p>
            </div>

            {/* Col 2: Free Tools */}
            <div className="space-y-3">
              <span className="text-white font-semibold text-xs tracking-wider uppercase text-slate-300">
                Free Developer Tools
              </span>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <Link href="/tools/side-to-playwright" className="hover:text-emerald-400 transition-colors">
                    .side to Playwright Converter
                  </Link>
                </li>
                <li>
                  <Link href="/tools/selector-generator" className="hover:text-emerald-400 transition-colors">
                    5-Tier Selector Waterfall
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Resources */}
            <div className="space-y-3">
              <span className="text-white font-semibold text-xs tracking-wider uppercase text-slate-300">
                Resources
              </span>
              <ul className="space-y-2 text-slate-400">
                <li>
                  <Link href="/" className="hover:text-emerald-400 transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-emerald-400 transition-colors">
                    Privacy Policy (Zero Data)
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:contact@naveensingh.guru"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    Support: contact@naveensingh.guru
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/Naveen071110/flowmacro"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-400 transition-colors"
                  >
                    GitHub Repository
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <span>© {new Date().getFullYear()} FlowMacro. 100% Client-Side Local Execution.</span>
            <span>Built by Naveen Guru</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
