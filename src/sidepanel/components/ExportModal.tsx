import React, { useState } from 'react';
import { Macro } from '../../types/macro';
import { exportToPlaywright } from '../../export/playwright';
import { exportToPuppeteer } from '../../export/puppeteer';
import { exportToSelenium } from '../../export/selenium';
import { exportToJson } from '../../export/json';
import { X, Copy, Check, Download, Code2 } from 'lucide-react';

interface ExportModalProps {
  macro: Macro;
  onClose: () => void;
}

type ExportTarget = 'playwright' | 'puppeteer' | 'selenium' | 'json';

export const ExportModal: React.FC<ExportModalProps> = ({ macro, onClose }) => {
  const [target, setTarget] = useState<ExportTarget>('playwright');
  const [copied, setCopied] = useState(false);

  const getCode = () => {
    switch (target) {
      case 'playwright':
        return exportToPlaywright(macro);
      case 'puppeteer':
        return exportToPuppeteer(macro);
      case 'selenium':
        return exportToSelenium(macro);
      case 'json':
        return exportToJson(macro);
    }
  };

  const code = getCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extMap: Record<ExportTarget, string> = {
      playwright: '.spec.ts',
      puppeteer: '.js',
      selenium: '.py',
      json: '.json',
    };
    const mimeMap: Record<ExportTarget, string> = {
      playwright: 'text/typescript',
      puppeteer: 'text/javascript',
      selenium: 'text/x-python',
      json: 'application/json',
    };

    const filename = `${macro.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}${extMap[target]}`;
    const blob = new Blob([code], { type: mimeMap[target] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="h-11 px-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-semibold text-zinc-200">
              Export Automation Code
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Tabs */}
        <div className="px-4 pt-3 pb-2 flex items-center gap-1.5 border-b border-zinc-800/80 bg-zinc-900/40 overflow-x-auto text-[11px] font-mono">
          <button
            onClick={() => setTarget('playwright')}
            className={`px-2.5 py-1 rounded transition-colors ${
              target === 'playwright'
                ? 'bg-zinc-800 text-zinc-100 font-medium'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Playwright TS
          </button>
          <button
            onClick={() => setTarget('puppeteer')}
            className={`px-2.5 py-1 rounded transition-colors ${
              target === 'puppeteer'
                ? 'bg-zinc-800 text-zinc-100 font-medium'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Puppeteer JS
          </button>
          <button
            onClick={() => setTarget('selenium')}
            className={`px-2.5 py-1 rounded transition-colors ${
              target === 'selenium'
                ? 'bg-zinc-800 text-zinc-100 font-medium'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            Selenium Python
          </button>
          <button
            onClick={() => setTarget('json')}
            className={`px-2.5 py-1 rounded transition-colors ${
              target === 'json'
                ? 'bg-zinc-800 text-zinc-100 font-medium'
                : 'text-zinc-400 hover:text-zinc-300'
            }`}
          >
            AutoMacro JSON
          </button>
        </div>

        {/* Code Viewport */}
        <div className="p-3 flex-1 overflow-auto bg-[#050507]">
          <pre className="text-[11px] font-mono text-zinc-300 whitespace-pre leading-relaxed select-text">
            <code>{code}</code>
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="h-12 px-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between gap-2">
          <button
            onClick={handleDownload}
            className="h-8 px-3 rounded border border-zinc-800 hover:bg-zinc-900 text-zinc-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download File</span>
          </button>

          <button
            onClick={handleCopy}
            className="h-8 px-4 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-950 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-zinc-950" />
                <span>Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-950" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
