import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShieldCheck, Database, Lock, EyeOff } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-200 font-sans selection:bg-emerald-500/20 selection:text-emerald-300 bg-blueprint-matrix">
      {/* Top Bar */}
      <header className="border-b border-slate-800/80 bg-[#0b0f17]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to AutoMacro IDE</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zero-Backend Architecture</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 font-mono">
            Privacy Policy &amp; Security Specs
          </h1>
          <p className="text-xs font-mono text-slate-500">
            Last updated: September 12, 2026 • Zero-Trust Standard
          </p>
        </div>

        <div className="space-y-10 text-xs text-slate-400 leading-relaxed font-mono">
          {/* Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-xl bg-[#0f172a] border border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-white font-medium">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>100% Local Storage</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Macros and suites stay inside your local Chrome storage.
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-white font-medium">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>AES-256-GCM Vault</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Passwords encrypted via client-side Web Crypto API.
              </p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-white font-medium">
                <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Telemetry</span>
              </div>
              <p className="text-[11px] text-slate-400">
                No third-party analytics or remote cloud tracking.
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono">01.</span>
              Zero-Backend &amp; Local Data Retention
            </h2>
            <p className="text-slate-400">
              AutoMacro IDE operates on a strictly client-side, zero-backend architecture. All recorded macro actions,
              DOM element selectors, click coordinates, form values, and execution logs are stored 100% locally
              on your machine using <code className="text-slate-200 bg-slate-900 px-1 py-0.5 rounded">chrome.storage.local</code>.
            </p>
            <p className="text-slate-400">
              AutoMacro does not maintain any external database, API server, or cloud repository. If you uninstall
              the extension or clear browser storage, your saved macros are erased permanently from your local device.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono">02.</span>
              Zero-Trust Credential &amp; Password Handling
            </h2>
            <p className="text-slate-400">
              AutoMacro IDE integrates a native Zero-Trust Credential Engine designed to prevent plain-text secrets from
              leaking into exported files, browser storage, or shared JSON configurations:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li>
                <strong className="text-slate-200">Automatic Masking:</strong> When typing into input elements
                with <code className="text-slate-200">type=&quot;password&quot;</code> or <code className="text-slate-200">autocomplete=&quot;current-password&quot;</code>,
                the extension masks the raw value in the IDE as <code className="text-emerald-400 bg-emerald-500/10 px-1 rounded">&#123;&#123;SECRET_PASSWORD&#125;&#125;</code>.
              </li>
              <li>
                <strong className="text-slate-200">Local AES-256-GCM Encryption:</strong> Sensitive inputs are encrypted
                on-the-fly using the W3C Web Crypto API with a locally generated 256-bit AES-GCM key and random 96-bit initialization vectors.
              </li>
              <li>
                <strong className="text-slate-200">Safe Code Exports:</strong> Exporting to Playwright, Puppeteer, or Python
                Selenium emits secure environment variable references (<code className="text-emerald-400">process.env.AUTO_MACRO_PASSWORD</code> or <code className="text-emerald-400">os.getenv(&quot;AUTO_MACRO_PASSWORD&quot;)</code>)
                instead of plain-text passwords.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono">03.</span>
              Browser Permissions &amp; Scope
            </h2>
            <p className="text-slate-400">AutoMacro IDE requests only the minimum required Chrome Manifest V3 permissions:</p>
            <div className="border border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-800 text-xs">
              <div className="p-3 bg-[#0f172a] flex justify-between">
                <span className="text-emerald-400">activeTab &amp; tabs</span>
                <span className="text-slate-400">Controls the target browser tab during recording and replay.</span>
              </div>
              <div className="p-3 bg-[#0f172a] flex justify-between">
                <span className="text-emerald-400">scripting</span>
                <span className="text-slate-400">Injects recorder and replayer content scripts into target pages.</span>
              </div>
              <div className="p-3 bg-[#0f172a] flex justify-between">
                <span className="text-emerald-400">storage</span>
                <span className="text-slate-400">Stores test suites and the client-side AES key locally.</span>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono">04.</span>
              Third-Party Payments
            </h2>
            <p className="text-slate-400">
              AutoMacro Pro lifetime licenses are processed securely by <strong>Dodo Payments</strong>.
              We do not collect, process, or store credit card numbers, billing addresses, or banking credentials.
              Payment transactions occur entirely within Dodo Payments&apos; PCI-compliant checkout infrastructure.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="text-emerald-400 font-mono">05.</span>
              Contact &amp; Inquiries
            </h2>
            <p className="text-slate-400">
              If you have any questions or security inquiries regarding AutoMacro, please contact:
            </p>
            <p className="text-emerald-400">
              naveen@automacro.dev
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-8 text-center text-xs font-mono text-slate-500 bg-[#090d14]">
        AutoMacro IDE • Terminal &amp; Security Blueprint Engine • Built by Naveen Guru
      </footer>
    </div>
  );
}
