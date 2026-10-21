'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Layers,
  Sparkles,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  Code2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Terminal,
  Activity
} from 'lucide-react';

interface LocatorTier {
  tier: number;
  name: string;
  strategy: string;
  selector: string;
  playwrightSnippet: string;
  flakinessScore: number; // 0 = ultra stable, 100 = very flaky
  status: 'recommended' | 'stable' | 'caution' | 'warning';
  notes: string;
}

interface AnalysisSuccess {
  element: string;
  tiers: LocatorTier[];
  resilienceScore: number;
  error: null;
}

interface AnalysisFailure {
  error: string;
  element?: never;
  tiers?: never;
  resilienceScore?: never;
}

type AnalysisResult = AnalysisSuccess | AnalysisFailure;

const SAMPLE_HTML_SNIPPETS = {
  modernButton: `<button 
  id="checkout-btn-1492" 
  data-testid="pay-order-button" 
  class="px-4 py-2 bg-emerald-500 rounded text-white font-medium hover:bg-emerald-600 shadow-md"
  name="submit_order" 
  aria-label="Complete Order and Pay"
  role="button"
>
  Complete Order ($49.00)
</button>`,

  dynamicInput: `<input 
  id="react-select-3-input" 
  type="email" 
  name="user_email" 
  placeholder="name@company.com" 
  class="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
  required 
/>`,

  accessibleLink: `<a 
  href="/settings/security" 
  role="link" 
  aria-label="Open Two-Factor Authentication Settings"
  class="inline-flex items-center gap-2 text-emerald-400 underline font-semibold"
>
  Configure 2FA Security
</a>`
};

export default function SelectorGeneratorPage() {
  const [htmlInput, setHtmlInput] = useState<string>(SAMPLE_HTML_SNIPPETS.modernButton);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const analysis = useMemo<AnalysisResult | null>(() => {
    if (typeof window === 'undefined') return null;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlInput, 'text/html');
      const elem = doc.body.firstElementChild as HTMLElement | null;

      if (!elem) {
        return { error: 'Please enter a valid HTML element snippet.' };
      }

      const tagName = elem.tagName.toLowerCase();
      const id = elem.getAttribute('id') || '';
      const dataTestId = elem.getAttribute('data-testid') || elem.getAttribute('data-test') || elem.getAttribute('data-cy') || elem.getAttribute('data-qa') || '';
      const name = elem.getAttribute('name') || '';
      const ariaLabel = elem.getAttribute('aria-label') || '';
      const role = elem.getAttribute('role') || (tagName === 'button' ? 'button' : tagName === 'a' ? 'link' : tagName === 'input' ? 'textbox' : '');
      const text = (elem.textContent || '').trim().replace(/\s+/g, ' ');
      const rawClass = elem.getAttribute('class') || '';

      // Detect if ID is dynamic (e.g. contains numbers, auto-generated hashes)
      const isDynamicId = /\d{3,}|[a-f0-9]{8,}|react-select|guid|uuid/i.test(id);

      const tiers: LocatorTier[] = [];

      // 1. Tier 1: Test ID
      if (dataTestId) {
        tiers.push({
          tier: 1,
          name: 'Dedicated Test ID',
          strategy: 'data-testid',
          selector: `[data-testid="${dataTestId}"]`,
          playwrightSnippet: `page.getByTestId('${dataTestId}')`,
          flakinessScore: 0,
          status: 'recommended',
          notes: 'Industry gold standard. Completely immune to UI redesigns and CSS refactors.'
        });
      } else {
        tiers.push({
          tier: 1,
          name: 'Dedicated Test ID',
          strategy: 'data-testid',
          selector: `[data-testid="<missing>"]`,
          playwrightSnippet: `// No data-testid found on element`,
          flakinessScore: 100,
          status: 'warning',
          notes: 'Missing data-testid attribute. Recommended to add data-testid for production CI/CD resilience.'
        });
      }

      // 2. Tier 2: Semantic ID / Name
      if (id && !isDynamicId) {
        tiers.push({
          tier: 2,
          name: 'Static Semantic ID',
          strategy: '#id',
          selector: `#${id}`,
          playwrightSnippet: `page.locator('#${id}')`,
          flakinessScore: 10,
          status: 'stable',
          notes: 'Static element ID. Highly stable provided backend templates do not randomize it.'
        });
      } else if (name) {
        tiers.push({
          tier: 2,
          name: 'Form Field Name',
          strategy: '[name="..."]',
          selector: `${tagName}[name="${name}"]`,
          playwrightSnippet: `page.locator('${tagName}[name="${name}"]')`,
          flakinessScore: 15,
          status: 'stable',
          notes: 'Form input name attribute. Standard for input and select fields.'
        });
      } else if (id && isDynamicId) {
        tiers.push({
          tier: 2,
          name: 'Dynamic ID (Fragile)',
          strategy: '#id',
          selector: `#${id}`,
          playwrightSnippet: `page.locator('#${id}')`,
          flakinessScore: 80,
          status: 'caution',
          notes: 'Warning: Contains digits or random hashes (e.g. React/Vue generated). Likely to break on page reload.'
        });
      }

      // 3. Tier 3: ARIA / Accessibility
      if (ariaLabel) {
        tiers.push({
          tier: 3,
          name: 'Accessible ARIA Label',
          strategy: 'getByRole / aria-label',
          selector: `${tagName}[aria-label="${ariaLabel}"]`,
          playwrightSnippet: role 
            ? `page.getByRole('${role}', { name: '${ariaLabel}' })` 
            : `page.locator('${tagName}[aria-label="${ariaLabel}"]')`,
          flakinessScore: 5,
          status: 'recommended',
          notes: 'Mimics real human screen-reader interaction. Very resilient to markup restructuring.'
        });
      } else if (text && text.length < 30) {
        tiers.push({
          tier: 3,
          name: 'Visible Text / Role',
          strategy: 'getByRole(name)',
          selector: `${tagName}:has-text("${text}")`,
          playwrightSnippet: role 
            ? `page.getByRole('${role}', { name: '${text}' })` 
            : `page.getByText('${text}')`,
          flakinessScore: 20,
          status: 'stable',
          notes: 'Locates element by user-visible label. Sensitive to copywriting changes.'
        });
      }

      // 4. Tier 4: Optimized CSS Selector
      // Filter out long utility classes (like Tailwind) to find meaningful semantic classes
      const cleanClasses = rawClass
        .split(/\s+/)
        .filter(c => !c.match(/^(p|m|px|py|bg|text|hover|focus|flex|grid|rounded|shadow|w-|h-|border)-/))
        .filter(Boolean);

      const stableCss = cleanClasses.length > 0 
        ? `${tagName}.${cleanClasses[0]}`
        : `${tagName}${name ? `[name="${name}"]` : ''}`;

      tiers.push({
        tier: 4,
        name: 'Optimized CSS Selector',
        strategy: 'CSS',
        selector: stableCss,
        playwrightSnippet: `page.locator('${stableCss}')`,
        flakinessScore: cleanClasses.length > 0 ? 35 : 50,
        status: 'caution',
        notes: 'Stripped utility classes to keep CSS selector compact. May match duplicates if multiple exist.'
      });

      // 5. Tier 5: Relative Semantic XPath
      let xpath = `//${tagName}`;
      if (dataTestId) {
        xpath = `//${tagName}[@data-testid='${dataTestId}']`;
      } else if (ariaLabel) {
        xpath = `//${tagName}[@aria-label='${ariaLabel}']`;
      } else if (name) {
        xpath = `//${tagName}[@name='${name}']`;
      } else if (text && text.length < 30) {
        xpath = `//${tagName}[normalize-space()='${text}']`;
      } else if (id && !isDynamicId) {
        xpath = `//${tagName}[@id='${id}']`;
      }

      tiers.push({
        tier: 5,
        name: 'Semantic Relative XPath',
        strategy: 'XPath',
        selector: xpath,
        playwrightSnippet: `page.locator('xpath=${xpath}')`,
        flakinessScore: 40,
        status: 'stable',
        notes: 'Relative semantic XPath. Avoids fragile absolute paths (e.g. /html/body/div[2]/...).'
      });

      // Overall Resilience Score (0 to 100)
      const validTiers = tiers.filter(t => t.flakinessScore < 100);
      const bestScore = validTiers.length > 0 ? Math.min(...validTiers.map(t => t.flakinessScore)) : 90;
      const resilienceScore = Math.max(10, 100 - bestScore);

      return {
        element: tagName,
        tiers,
        resilienceScore,
        error: null
      };
    } catch (e: any) {
      return { error: 'Could not parse HTML: ' + e.message };
    }
  }, [htmlInput]);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-200 selection:bg-emerald-500/20 selection:text-emerald-300 font-sans">
      {/* Top Breadcrumb Bar */}
      <header className="border-b border-slate-800/80 bg-[#090d14]/90 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <Image
                src="/flowmacro_store_icon_128x128.png"
                alt="FlowMacro Logo"
                width={28}
                height={28}
                className="rounded group-hover:scale-105 transition-transform"
              />
              <span className="font-bold text-white tracking-tight group-hover:text-emerald-400 transition-colors">
                FlowMacro
              </span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400 text-sm font-mono">Tools</span>
            <span className="text-slate-600">/</span>
            <span className="text-emerald-400 text-sm font-mono font-medium">5-Tier Selector Waterfall Generator</span>
          </div>

          <a
            href="https://chromewebstore.google.com/detail/flowmacro-%E2%80%94-web-automatio/agehjimobcongfgkagfjhmlibkkmjppc"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold hover:bg-emerald-500/20 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Install Extension (Free)
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            FlowMacro Autonomous Waterfall Engine
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            5-Tier Selector Waterfall & <span className="text-emerald-400">Flakiness Analyzer</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Stop relying on brittle absolute XPaths and auto-generated classes that break tests in CI/CD. Paste any HTML snippet to calculate all 5 resilient locator tiers and measure your flakiness risk score.
          </p>
        </div>

        {/* Interactive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Input and Presets (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-white font-mono text-sm font-semibold flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Target HTML Element Snippet
                </span>
              </div>

              {/* Sample Preset Buttons */}
              <div className="space-y-1.5">
                <span className="text-xs font-mono text-slate-500">Try sample presets:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setHtmlInput(SAMPLE_HTML_SNIPPETS.modernButton)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
                  >
                    Button with TestID
                  </button>
                  <button
                    onClick={() => setHtmlInput(SAMPLE_HTML_SNIPPETS.dynamicInput)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
                  >
                    Dynamic React ID Input
                  </button>
                  <button
                    onClick={() => setHtmlInput(SAMPLE_HTML_SNIPPETS.accessibleLink)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors"
                  >
                    Accessible ARIA Link
                  </button>
                </div>
              </div>

              {/* Text Area */}
              <textarea
                value={htmlInput}
                onChange={(e) => setHtmlInput(e.target.value)}
                rows={9}
                className="w-full bg-[#090d14] border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-300 focus:outline-none focus:border-emerald-500/60 transition-colors resize-y leading-relaxed"
                placeholder="Paste an HTML element like <button class='...'>Click Me</button>..."
              />

              {/* Resilience Score Card */}
              {analysis && analysis.error === null && (
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-emerald-400" />
                      Automation Resilience Score
                    </span>
                    <p className="text-xs text-slate-500">
                      {analysis.resilienceScore >= 80 
                        ? 'Excellent. Immune to standard styling and structural refactors.'
                        : analysis.resilienceScore >= 50
                        ? 'Moderate. Vulnerable if classes or auto-generated IDs change.'
                        : 'Fragile. Highly susceptible to breaking in CI/CD.'}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className={`text-2xl font-mono font-extrabold ${
                      analysis.resilienceScore >= 80 ? 'text-emerald-400' : analysis.resilienceScore >= 50 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {analysis.resilienceScore}/100
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Why the Waterfall Matters info card */}
            <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-5 space-y-3 text-xs font-mono text-slate-400">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                How FlowMacro's Waterfall Works
              </h3>
              <p className="leading-relaxed">
                Single-selector tools (like legacy Selenium IDE) record one path. If a developer tweaks CSS, tests crash. FlowMacro captures all 5 tiers simultaneously during recording. During playback, if Tier 1 fails, it auto-falls back to Tier 2, 3, 4, or 5 in real-time.
              </p>
            </div>
          </div>

          {/* Right Column: Calculated 5 Tiers (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white font-mono text-sm font-semibold flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Calculated Waterfall Tiers (Priority Order)
              </span>
            </div>

            {analysis && analysis.error !== null ? (
              <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono">
                {analysis.error}
              </div>
            ) : analysis && analysis.error === null ? (
              <div className="space-y-3.5">
                {analysis.tiers.map((t, idx) => {
                  const isTop = t.status === 'recommended';
                  return (
                    <div
                      key={idx}
                      className={`rounded-xl border p-4 space-y-2.5 transition-all ${
                        isTop
                          ? 'border-emerald-500/40 bg-emerald-950/20 shadow-lg shadow-emerald-500/5'
                          : t.status === 'warning'
                          ? 'border-red-500/30 bg-red-950/10 opacity-75'
                          : 'border-slate-800 bg-[#0d131f]'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                            isTop 
                              ? 'bg-emerald-500 text-slate-950' 
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            Tier {t.tier}
                          </span>
                          <span className="text-white text-xs font-mono font-semibold">{t.name}</span>
                          <span className="text-slate-500 text-[11px] font-mono">({t.strategy})</span>
                        </div>

                        <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded ${
                          t.flakinessScore <= 10
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : t.flakinessScore <= 40
                            ? 'text-amber-400 bg-amber-500/10'
                            : 'text-red-400 bg-red-500/10'
                        }`}>
                          {t.flakinessScore === 0 ? '0% Flakiness (Optimal)' : `${t.flakinessScore}% Flakiness Risk`}
                        </span>
                      </div>

                      {/* Selector / Snippet Box */}
                      <div className="flex items-center justify-between gap-2 bg-[#090d14] border border-slate-800/80 rounded-lg p-2.5 font-mono text-xs">
                        <span className="text-emerald-300 truncate select-all">{t.playwrightSnippet}</span>
                        <button
                          onClick={() => handleCopy(t.playwrightSnippet, idx)}
                          className="shrink-0 p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          title="Copy Playwright Snippet"
                        >
                          {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <p className="text-[11px] font-mono text-slate-400">{t.notes}</p>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        {/* CTA Card */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-[#0d131f] to-slate-900/60 p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Automated in FlowMacro
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Capture all 5 locator tiers automatically while you click
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              You don't need to manually inspect elements or calculate waterfall tiers. FlowMacro's Chrome extension records clicks, pierces Shadow DOM, and captures all 5 fallback selectors in real-time.
            </p>
          </div>

          <a
            href="https://chromewebstore.google.com/detail/flowmacro-%E2%80%94-web-automatio/agehjimobcongfgkagfjhmlibkkmjppc"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-mono font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
          >
            Add FlowMacro to Chrome (Free)
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </main>
    </div>
  );
}
