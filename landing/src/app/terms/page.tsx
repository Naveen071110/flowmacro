import React from "react";
import Link from "next/link";
import { ArrowLeft, FileText, ShieldCheck, Scale, AlertCircle, Mail, MapPin } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-200 font-sans selection:bg-emerald-500/20 selection:text-emerald-300 bg-blueprint-matrix">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-[#0b0f17]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to FlowMacro IDE</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <Scale className="w-3.5 h-3.5" />
            <span>Standard Terms of Use</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10 space-y-2 font-mono">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs">
            <FileText className="w-3.5 h-3.5" />
            <span>Legal Specification</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Terms &amp; Conditions
          </h1>
          <p className="text-xs text-slate-500">
            Last updated: October 2026 • Effective Date: Immediate
          </p>
        </div>

        <div className="space-y-10 text-xs text-slate-400 leading-relaxed font-mono">
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="text-emerald-400">1.</span> Agreement to Terms
            </h2>
            <p>
              By installing, accessing, or using the FlowMacro Chrome Extension, website (flowmacro.vercel.app), or associated utilities, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must discontinue using FlowMacro and uninstall the extension.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="text-emerald-400">2.</span> 100% Client-Side Execution &amp; Data Ownership
            </h2>
            <p>
              FlowMacro operates entirely on client-side browser technology (Google Chrome Manifest V3, Web Crypto API, and local storage). 
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li>FlowMacro does not transmit, store, or process your recordings, scripts, DOM selectors, or test values on any external server.</li>
              <li>You retain 100% full, unencumbered ownership of all macros, test suites, generated Playwright/Python code, and exports.</li>
              <li>You are solely responsible for backing up your local test data.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="text-emerald-400">3.</span> Acceptable Use Policy
            </h2>
            <p>
              You agree to use FlowMacro strictly for lawful testing, development, and personal productivity purposes. You agree NOT to use FlowMacro to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
              <li>Execute automated denial-of-service (DoS) attacks or deliberately overload web servers.</li>
              <li>Bypass authentication mechanisms on systems you do not own or have written permission to test.</li>
              <li>Harvest or scrape personal data in violation of applicable data protection laws (e.g. GDPR, CCPA).</li>
              <li>Violate the Terms of Service of any third-party websites or services you automate.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="text-emerald-400">4.</span> Intellectual Property &amp; License
            </h2>
            <p>
              The FlowMacro software, visual designs, brand assets, and documentation are the intellectual property of Naveen Guru. You are granted a personal, non-exclusive, revocable license to install and use the extension. Code exported by FlowMacro (e.g. Playwright, Puppeteer, Python scripts) is released to you free of licensing restrictions for personal or commercial use.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="text-emerald-400">5.</span> Disclaimer of Warranties &amp; Limitation of Liability
            </h2>
            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-300 space-y-2">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="w-4 h-4" />
                <span>AS-IS Software Notice</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-200/80">
                FlowMacro is provided &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; without warranties of any kind, whether express or implied. Under no circumstances shall the developer be liable for any direct, indirect, incidental, consequential, or punitive damages arising from the execution of automated test steps, form submissions, or third-party web actions executed via the extension.
              </p>
            </div>
          </section>

          {/* Section 6 - Real Contact Address */}
          <section className="space-y-3 border-t border-slate-800 pt-8">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span className="text-emerald-400">6.</span> Contact &amp; Governance
            </h2>
            <p>
              For legal inquiries, feedback, or support regarding these terms:
            </p>
            <div className="p-4 rounded-xl border border-slate-800 bg-[#0d131f] space-y-2 text-slate-300">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400" />
                <span>Email: contact@naveensingh.guru</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Developer Jurisdiction: Naveen Guru • New Delhi, India</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#090d14] py-8 px-6 text-center text-xs font-mono text-slate-600">
        <span>© {new Date().getFullYear()} FlowMacro IDE • Built by Naveen Guru</span>
      </footer>
    </div>
  );
}
