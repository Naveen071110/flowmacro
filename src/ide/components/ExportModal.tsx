import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  FileCode,
  ShieldCheck,
  Terminal,
  FileText,
} from 'lucide-react';
import { TestSuite } from '../../types/macro';
import { exportToPlaywright } from '../../export/playwright';
import { exportToPuppeteer } from '../../export/puppeteer';
import { exportToSelenium } from '../../export/selenium';
import { exportToSeleniumSide } from '../../export/side';
import { exportToJson } from '../../export/json';

interface ExportModalProps {
  suite: TestSuite;
  onClose: () => void;
}

type ExportTab = 'playwright' | 'puppeteer' | 'selenium' | 'side' | 'json';

export const ExportModal: React.FC<ExportModalProps> = ({ suite, onClose }) => {
  const [activeTab, setActiveTab] = useState<ExportTab>('playwright');
  const [copied, setCopied] = useState(false);

  // Compute code outputs
  const getExportCode = (tab: ExportTab): { code: string; filename: string; language: string } => {
    const slug = (suite.name || 'test-suite')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    switch (tab) {
      case 'playwright':
        return {
          code: exportToPlaywright(suite),
          filename: `${slug}.spec.ts`,
          language: 'typescript',
        };
      case 'puppeteer':
        return {
          code: exportToPuppeteer(suite),
          filename: `${slug}.puppeteer.js`,
          language: 'javascript',
        };
      case 'selenium':
        return {
          code: exportToSelenium(suite),
          filename: `test_${slug.replace(/-/g, '_')}.py`,
          language: 'python',
        };
      case 'side':
        return {
          code: exportToSeleniumSide(suite),
          filename: `${slug}.side`,
          language: 'json',
        };
      case 'json':
        return {
          code: exportToJson(suite),
          filename: `${slug}.automacro.json`,
          language: 'json',
        };
    }
  };

  const currentExport = getExportCode(activeTab);
  const hasSensitiveData = suite.commands.some((c) => c.isSensitive);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentExport.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentExport.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentExport.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-[#0c0c0e] border border-zinc-800/80 rounded-xl shadow-2xl flex flex-col overflow-hidden text-zinc-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                Export Test Suite
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-400 font-mono">
                  {suite.commands.length} steps
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Generate production-grade automation code or Selenium IDE project files
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Security Banner if credentials exist */}
        {hasSensitiveData && (
          <div className="px-6 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 text-xs text-amber-300">
            <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              <strong>Zero-Trust Credential Vault Active:</strong> Passwords have been replaced with
              secure environment variables (<code className="font-mono text-amber-200">SECRET_PASSWORD</code>). No plain-text secrets are exported.
            </span>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex items-center justify-between px-6 border-b border-zinc-800/80 bg-zinc-900/30">
          <div className="flex items-center gap-1 -mb-px">
            <button
              onClick={() => setActiveTab('playwright')}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all ${
                activeTab === 'playwright'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Playwright (TS)
            </button>

            <button
              onClick={() => setActiveTab('puppeteer')}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all ${
                activeTab === 'puppeteer'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Puppeteer (JS)
            </button>

            <button
              onClick={() => setActiveTab('selenium')}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all ${
                activeTab === 'selenium'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Python Selenium
            </button>

            <button
              onClick={() => setActiveTab('side')}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all ${
                activeTab === 'side'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              Selenium IDE (.side)
            </button>

            <button
              onClick={() => setActiveTab('json')}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all ${
                activeTab === 'json'
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              AutoMacro JSON
            </button>
          </div>

          <div className="flex items-center gap-2 py-2">
            <span className="text-[11px] text-zinc-500 font-mono">{currentExport.filename}</span>
          </div>
        </div>

        {/* Code Preview Area */}
        <div className="relative flex-1 min-h-[360px] max-h-[480px] bg-[#070709] overflow-auto p-4 font-mono text-xs leading-relaxed text-zinc-300 border-b border-zinc-800/80 select-text">
          <pre className="whitespace-pre overflow-x-auto selection:bg-emerald-500/30">
            <code>{currentExport.code}</code>
          </pre>
        </div>

        {/* Modal Footer Controls */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-zinc-950/60">
          <div className="text-xs text-zinc-400">
            {activeTab === 'side' && (
              <span>Directly compatible with official Selenium IDE extension and CLI runner.</span>
            )}
            {activeTab === 'playwright' && (
              <span>Run with: <code className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">npx playwright test</code></span>
            )}
            {activeTab === 'puppeteer' && (
              <span>Run with: <code className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">node {currentExport.filename}</code></span>
            )}
            {activeTab === 'selenium' && (
              <span>Run with: <code className="text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">python {currentExport.filename}</code></span>
            )}
            {activeTab === 'json' && (
              <span>Portable project format for backup or team sharing.</span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium transition-all shadow-sm active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Copy Code</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all shadow-sm active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
