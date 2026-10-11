import React from "react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
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
} from "lucide-react";

export const metadata: Metadata = {
  title: "FlowMacro Documentation & Knowledge Base — Guides & Troubleshooting",
  description:
    "Complete technical documentation and troubleshooting guide for FlowMacro IDE. Learn how to record macros, configure the 5-tier selector waterfall, solve multi-step auth, and export Playwright tests.",
};

const CHROME_STORE_URL =
  "https://chromewebstore.google.com/detail/flowmacro-%E2%80%94-web-automatio/agehjimobcongfgkagfjhmlibkkmjppc?hl=en-US&utm_source=ext_sidebar";

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-200 font-sans selection:bg-emerald-500/20 selection:text-emerald-300 antialiased bg-blueprint-matrix">
      {/* 1. TOP NAVIGATION BAR */}
      <header className="border-b border-slate-800/80 bg-[#0b0f17]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
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
                width={20}
                height={20}
                className="rounded"
              />
              <span className="text-xs font-mono font-bold text-white">Docs &amp; Help</span>
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
              <span>Issues</span>
            </a>

            <a
              href={CHROME_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 px-3.5 py-1.5 rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] active:scale-95"
            >
              <span>Add to Chrome</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </header>

      {/* 2. HERO BANNER */}
      <section className="py-16 px-6 border-b border-slate-800/80 bg-gradient-to-b from-[#0e1524] to-[#0b0f17]">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-semibold mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            <span>KNOWLEDGE BASE &amp; TROUBLESHOOTING</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white mb-4 font-mono">
            FlowMacro Documentation
          </h1>

          <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto font-sans leading-relaxed">
            Everything you need to master zero-backend browser automation: from recording resilient flows to surviving multi-step logins, safeguarding secrets with AES-256, and exporting test suites.
          </p>

          {/* Quick Anchor Jumps */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 font-mono text-xs">
            <a
              href="#quickstart"
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors"
            >
              01. Quick Start
            </a>
            <a
              href="#waterfall"
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors"
            >
              02. 5-Tier Waterfall
            </a>
            <a
              href="#vault"
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors"
            >
              03. Secret Vault
            </a>
            <a
              href="#auth"
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors"
            >
              04. Multi-Step Login
            </a>
            <a
              href="#errors"
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors"
            >
              05. Target Not Found
            </a>
            <a
              href="#exporters"
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors"
            >
              06. Code Exporters
            </a>
            <a
              href="#support"
              className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-colors"
            >
              07. Help &amp; Support
            </a>
          </div>
        </div>
      </section>

      {/* 3. MAIN CONTENT CONTAINER */}
      <main className="max-w-5xl mx-auto px-6 py-16 space-y-20">

        {/* SECTION 1: QUICK START GUIDE */}
        <section id="quickstart" className="scroll-mt-24 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center">
              01
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white font-mono">
                Quick Start: Your First Automation
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Record, replay, and manage browser actions in under 60 seconds.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-white font-mono font-bold text-xs">
                <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                  1
                </span>
                <span>Open Controller IDE</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Click the FlowMacro icon in your Chrome extensions bar. A standalone 960 &times; 750px controller window appears, connected to your active browser tab.
              </p>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-slate-400">
                Shortcut: <code className="text-emerald-300">Alt + Shift + R</code> to launch
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-white font-mono font-bold text-xs">
                <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                  2
                </span>
                <span>Record Interactions</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Enter your starting URL and click <strong className="text-emerald-400 font-mono">Record</strong>. Navigate, click, and type freely. Actions stream live into the IDE command table.
              </p>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-emerald-400">
                Passwords are automatically masked in memory
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-white font-mono font-bold text-xs">
                <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                  3
                </span>
                <span>Replay &amp; Export</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                Click <strong className="text-emerald-400 font-mono">Stop</strong>. Hit <strong className="text-white font-mono">Replay Macro</strong> to test execution in your tab. When satisfied, export to Playwright, Puppeteer, Python, or .side.
              </p>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800/80 font-mono text-[11px] text-slate-400">
                Speed options: 0.5x, 1x, or 2x
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: 5-TIER SELECTOR WATERFALL */}
        <section id="waterfall" className="scroll-mt-24 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center">
              02
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white font-mono">
                The 5-Tier Selector Waterfall
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Why FlowMacro macros survive redesigns, dynamic classes, and Shadow DOMs.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#0f172a] border border-slate-800 space-y-6 font-mono text-xs">
            <p className="text-slate-300 leading-relaxed font-sans">
              Traditional recorders capture only brittle CSS selectors (like <code className="text-slate-400 bg-slate-900 px-1 py-0.5 rounded">.css-19f8x7y</code>) which break the moment a frontend app is rebuilt. FlowMacro computes five distinct locators for every target element in descending priority:
            </p>

            <div className="space-y-3 font-mono">
              <div className="p-3.5 rounded-lg bg-[#0b0f17] border border-slate-800 flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[11px] font-bold shrink-0">
                  Tier 1
                </span>
                <div>
                  <h4 className="text-white font-bold">QA &amp; Test Attributes</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Checks for <code className="text-emerald-300">data-testid</code>, <code className="text-emerald-300">data-test</code>, <code className="text-emerald-300">data-cy</code>, and <code className="text-emerald-300">data-qa</code>. The gold standard for resilient test automation.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0b0f17] border border-slate-800 flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[11px] font-bold shrink-0">
                  Tier 2
                </span>
                <div>
                  <h4 className="text-white font-bold">Semantic ID Filter</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Uses unique <code className="text-blue-300">id=&quot;identifier-field&quot;</code>, while automatically discarding ephemeral autogenerated IDs (e.g. <code className="text-slate-500">:r1:</code>, <code className="text-slate-500">ember1284</code>, <code className="text-slate-500">rc-tabs-0-tab</code>).
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0b0f17] border border-slate-800 flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[11px] font-bold shrink-0">
                  Tier 3
                </span>
                <div>
                  <h4 className="text-white font-bold">Semantic ARIA &amp; Accessible Roles</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Captures <code className="text-purple-300">[aria-label=&quot;Sign In&quot;]</code>, <code className="text-purple-300">[placeholder=&quot;Search...&quot;]</code>, and accessible button roles.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0b0f17] border border-slate-800 flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[11px] font-bold shrink-0">
                  Tier 4
                </span>
                <div>
                  <h4 className="text-white font-bold">Sanitized Hierarchical CSS Path</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    Generates clean CSS selectors while scrubbing dynamic emoji classes (e.g. <code className="text-slate-500">.🔒️</code>) and transient animation hashes.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0b0f17] border border-slate-800 flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-[11px] font-bold shrink-0">
                  Tier 5
                </span>
                <div>
                  <h4 className="text-white font-bold">Robust XPath Fallback</h4>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    If all CSS selectors fail during dynamic DOM mutation, FlowMacro seamlessly falls back to structural XPath.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[#0b0f17] border border-emerald-500/30 flex items-start gap-3 text-xs">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Shadow DOM &amp; Iframe Support:</strong> FlowMacro utilizes <code className="text-emerald-300">composedPath()</code> to pierce open Shadow DOM boundaries and accurately dispatches commands to cross-origin iframes using target <code className="text-emerald-300">frameId</code> resolution.
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: ZERO-TRUST AES-256 VAULT */}
        <section id="vault" className="scroll-mt-24 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center">
              03
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white font-mono">
                Zero-Trust Credential &amp; Secret Vault
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                How FlowMacro prevents passwords from ever leaking into plain-text files or Git repos.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#0f172a] border border-slate-800 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-mono text-xs">
              <div className="p-4 rounded-lg bg-[#0b0f17] border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <span>Traditional Macro Recorders</span>
                </div>
                <p className="text-slate-400 font-sans text-xs leading-relaxed">
                  Save your real master password as <code className="text-rose-300">&quot;SuperSecret123!&quot;</code> directly into exported JSON or test scripts. Anyone with access to the repo or log files can read it.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#0b0f17] border border-emerald-500/40 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>FlowMacro Zero-Trust Vault</span>
                </div>
                <p className="text-slate-400 font-sans text-xs leading-relaxed">
                  Masks the field as <code className="text-emerald-300 bg-emerald-500/10 px-1 py-0.5 rounded">&#123;&#123;SECRET_PASSWORD&#125;&#125;</code> and encrypts the value in transient RAM using <strong className="text-white">AES-256-GCM</strong>.
                </p>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <h4 className="text-white font-bold text-sm">How exported code handles your secrets:</h4>
              <p className="text-slate-400 font-sans text-xs">
                When you click export to Playwright, Puppeteer, or Python Selenium, FlowMacro references a secure environment variable instead of hardcoding any credentials:
              </p>

              <div className="p-4 rounded-lg bg-[#090d14] border border-slate-800 text-xs overflow-x-auto text-slate-300">
                <pre>{`// Generated Playwright Script
const AUTO_MACRO_PASSWORD = process.env.AUTO_MACRO_PASSWORD || '';

// Step: TYPE id=password-field
await page.locator("#password-field").fill(AUTO_MACRO_PASSWORD);`}</pre>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: MULTI-STEP LOGIN & AUTH FLOWS */}
        <section id="auth" className="scroll-mt-24 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center">
              04
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white font-mono">
                Troubleshooting Multi-Step Logins (Clerk, Supabase, NextAuth)
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Surviving two-screen auth forms, hash redirects, and login reloads.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#0f172a] border border-slate-800 space-y-6 text-xs font-mono">
            <p className="text-slate-300 leading-relaxed font-sans">
              Modern authentication providers (such as Clerk, Supabase, Auth0, and NextAuth) frequently split login into two separate screens: <strong>Screen 1 (Username / Email)</strong> &rarr; Click Continue &rarr; <strong>Screen 2 (Password)</strong> &rarr; Click Sign In. Here is how to ensure smooth replay:
            </p>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[#0b0f17] border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Symptom: Ghost SUBMIT steps recorded during screen transitions</span>
                </div>
                <p className="text-slate-300 font-sans leading-relaxed">
                  When you press Enter or click &quot;Continue&quot;, modern form libraries often emit both a <code className="text-slate-200">click</code> on the primary button AND a form <code className="text-slate-200">submit</code> event. During recording, this might appear as duplicate submit steps before the password screen loads.
                </p>
                <div className="p-3 rounded bg-slate-900 border border-slate-800 text-emerald-300">
                  <strong className="text-white">Solution:</strong> Inspect your steps in the FlowMacro IDE table. If you notice redundant <code className="text-slate-200">SUBMIT</code> steps right after clicking Continue, simply click the <strong>Trash icon</strong> to delete them. The clean flow should look like:
                  <div className="mt-2 text-slate-300 font-mono text-[11px] space-y-1">
                    <div>1. TYPE: id=identifier-field (e.g. username)</div>
                    <div>2. CLICK: button.cl-formButtonPrimary (Continue)</div>
                    <div>3. TYPE: id=password-field (&#123;&#123;SECRET_PASSWORD&#125;&#125;)</div>
                    <div>4. CLICK: button.cl-formButtonPrimary (Sign In)</div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-[#0b0f17] border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Page Redirects &amp; Hash Changes (#/factor-one)</span>
                </div>
                <p className="text-slate-400 font-sans leading-relaxed">
                  When the URL updates to <code className="text-slate-200">/#/factor-one</code>, FlowMacro automatically injects both the recorder and replayer into the new state. If the password input takes a brief moment to animate into view, FlowMacro&apos;s replayer will automatically poll up to 6000ms until the element appears.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: "TARGET NOT FOUND IN DOM" & TIMING */}
        <section id="errors" className="scroll-mt-24 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center">
              05
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white font-mono">
                Resolving &quot;Target Not Found in DOM within 6000ms&quot;
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Diagnosing and fixing timeout errors during macro replay.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#0f172a] border border-slate-800 space-y-5 text-xs font-mono">
            <p className="text-slate-300 leading-relaxed font-sans">
              If a step fails during replay, FlowMacro outputs an execution error showing all attempted locators from the 5-tier waterfall:
            </p>

            <div className="p-4 rounded-lg bg-[#090d14] border border-rose-500/40 text-rose-300 overflow-x-auto">
              <code>Replay Error: Step 7 [CLICK: css=form &gt; button] failed: Target not found in DOM within 6000ms. Attempted locators: [&quot;css=form &gt; button&quot;, &quot;xpath=//form[1]//button[1]&quot;]</code>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
              <div className="p-4 rounded-lg bg-[#0b0f17] border border-slate-800 space-y-2">
                <h4 className="text-white font-bold font-mono text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Fix 1: Switch Locator in Command Inspector
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Click the failed step in the FlowMacro IDE table. In the Command Inspector, toggle from the dynamic CSS selector to an <strong>ARIA label</strong> (e.g. <code className="text-slate-200 font-mono">[aria-label=&quot;Sign In&quot;]</code>) or <strong>id</strong>.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#0b0f17] border border-slate-800 space-y-2">
                <h4 className="text-white font-bold font-mono text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Fix 2: Add a Pause / Wait Step
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  If the target website has heavy lazy-loading or animated modals, click <strong>+ Add Step</strong> in the IDE and insert a brief <code>waitFor</code> or <code>pause (1500ms)</code> right before the action.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#0b0f17] border border-slate-800 space-y-2">
                <h4 className="text-white font-bold font-mono text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Fix 3: Remove Redundant / Destroyed Element
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  If the step is attempting to click a button that was unmounted immediately upon submitting the previous form, you can safely delete this redundant step.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#0b0f17] border border-slate-800 space-y-2">
                <h4 className="text-white font-bold font-mono text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Fix 4: Reorder Steps with Arrow Controls
                </h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Use the <strong>&uarr; Up</strong> and <strong>&darr; Down</strong> buttons on any step row to ensure prerequisite fields are filled before submitting the form.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 6: CODE EXPORTERS & CI/CD */}
        <section id="exporters" className="scroll-mt-24 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center">
              06
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-white font-mono">
                Code Exporters &amp; CI/CD Pipelines
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Export to Playwright, Puppeteer, Python Selenium, or Selenium IDE .side.
              </p>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-[#0f172a] border border-slate-800 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
              <div className="p-4 rounded-lg bg-[#0b0f17] border border-slate-800 space-y-1">
                <div className="text-emerald-400 font-bold">Playwright (TS)</div>
                <p className="text-slate-400 text-[11px] font-sans">
                  Modern async/await TypeScript with native locator fallbacks and environment variable secrets.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#0b0f17] border border-slate-800 space-y-1">
                <div className="text-emerald-400 font-bold">Puppeteer (JS)</div>
                <p className="text-slate-400 text-[11px] font-sans">
                  Ready-to-run Node.js scripts for lightweight web scraping and headless browser testing.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#0b0f17] border border-slate-800 space-y-1">
                <div className="text-emerald-400 font-bold">Python Selenium</div>
                <p className="text-slate-400 text-[11px] font-sans">
                  Standard Selenium WebDriver scripts using <code className="text-slate-200">WebDriverWait</code> and Chrome Options.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-[#0b0f17] border border-slate-800 space-y-1">
                <div className="text-emerald-400 font-bold">Selenium IDE (.side)</div>
                <p className="text-slate-400 text-[11px] font-sans">
                  Interchangeable JSON schema compatible with legacy test runners and IDE extensions.
                </p>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <h4 className="text-white font-bold">Running exported Playwright tests in GitHub Actions:</h4>
              <div className="p-4 rounded-lg bg-[#090d14] border border-slate-800 text-xs overflow-x-auto text-slate-300">
                <pre>{`name: Playwright Tests
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

        {/* SECTION 7: DIRECT SUPPORT & CONTACT */}
        <section id="support" className="scroll-mt-24 space-y-6">
          <div className="p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0e1726] to-slate-900 border border-emerald-500/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Mail className="w-7 h-7" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 mb-2">
                  <span>Direct Developer Support</span>
                </div>
                <h3 className="text-xl font-bold text-white font-mono">
                  Need Help, Found an Edge Case, or Have Feedback?
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-xl font-sans">
                  Are you encountering an unusual web application, dynamic form, or have a feature request? Reach out directly — we actively assist users and respond promptly!
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
                <span>Open GitHub Issue</span>
              </a>
            </div>
          </div>
        </section>

      </main>

      {/* 4. FOOTER */}
      <footer className="border-t border-slate-800/80 bg-[#090d14] py-10 px-6 text-xs font-mono text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-slate-400">
            <Image
              src="/flowmacro_store_icon_128x128.png"
              alt="FlowMacro IDE Logo"
              width={20}
              height={20}
              className="rounded"
            />
            <span className="text-white font-bold">FlowMacro IDE</span>
            <span>• Zero-Backend Automation Engine</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-emerald-400 transition-colors">
              Home
            </Link>
            <Link href="/privacy" className="hover:text-emerald-400 transition-colors">
              Privacy Policy
            </Link>
            <a
              href="https://github.com/Naveen071110/flowmacro"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-400 transition-colors"
            >
              GitHub
            </a>
            <a
              href="mailto:contact@naveensingh.guru"
              className="hover:text-emerald-400 transition-colors"
            >
              contact@naveensingh.guru
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
