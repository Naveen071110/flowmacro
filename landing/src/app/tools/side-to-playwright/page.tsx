'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FileCode, 
  Upload, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  ArrowRight, 
  Terminal, 
  ShieldCheck, 
  RefreshCw,
  Layers,
  Code2,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';

interface SideCommand {
  id: string;
  comment?: string;
  command: string;
  target?: string;
  targets?: [string, string][];
  value?: string;
}

interface SideTest {
  id: string;
  name: string;
  commands: SideCommand[];
}

interface SideProject {
  id?: string;
  version?: string;
  name?: string;
  url?: string;
  tests: SideTest[];
  suites?: { id: string; name: string; tests: string[] }[];
}

const SAMPLE_SIDE_PROJECT: SideProject = {
  id: "sample_project_01",
  version: "2.0",
  name: "E-Commerce Checkout & Login Flow",
  url: "https://demo.playwright.dev",
  tests: [
    {
      id: "test_login_flow",
      name: "User Login & Item Search",
      commands: [
        {
          id: "cmd_1",
          command: "open",
          target: "https://demo.playwright.dev/todomvc/",
          value: ""
        },
        {
          id: "cmd_2",
          command: "waitFor",
          target: "css=.new-todo",
          value: ""
        },
        {
          id: "cmd_3",
          command: "type",
          target: "css=.new-todo",
          value: "Buy groceries and setup Playwright"
        },
        {
          id: "cmd_4",
          command: "submit",
          target: "css=.new-todo",
          value: ""
        },
        {
          id: "cmd_5",
          command: "click",
          target: "xpath=//input[@class='toggle']",
          value: ""
        },
        {
          id: "cmd_6",
          command: "assertText",
          target: "css=.todo-count",
          value: "0 items left"
        }
      ]
    }
  ]
};

function cleanLocator(target: string): string {
  if (!target) return 'body';
  if (target.startsWith('id=')) return `#${target.replace(/^id=/, '')}`;
  if (target.startsWith('name=')) return `[name="${target.replace(/^name=/, '')}"]`;
  if (target.startsWith('css=')) return target.replace(/^css=/, '');
  if (target.startsWith('xpath=')) return target.replace(/^xpath=/, '');
  return target;
}

function convertToPlaywrightTS(project: SideProject, testIndex = 0): string {
  const test = project.tests[testIndex] || project.tests[0];
  if (!test) return '// No test found in .side project';

  const baseUrl = project.url || 'https://example.com';
  let lines: string[] = [];

  lines.push(`import { test, expect } from '@playwright/test';`);
  lines.push(``);
  lines.push(`/**`);
  lines.push(` * Generated from Selenium IDE (.side) by FlowMacro Converter`);
  lines.push(` * Project: ${project.name || 'Untitled Project'}`);
  lines.push(` * Test: ${test.name || 'Test Case'}`);
  lines.push(` */`);
  lines.push(`test.describe('${project.name || 'Converted Suite'}', () => {`);
  lines.push(`  test('${test.name || 'Automated Test'}', async ({ page }) => {`);

  test.commands.forEach((cmd, idx) => {
    lines.push(`    // Step ${idx + 1}: ${cmd.command.toUpperCase()}${cmd.comment ? ` - ${cmd.comment}` : ''}`);
    const loc = cleanLocator(cmd.target || '');
    const val = cmd.value || '';

    switch (cmd.command) {
      case 'open': {
        const dest = cmd.target?.startsWith('http') ? cmd.target : `${baseUrl.replace(/\/$/, '')}/${(cmd.target || '').replace(/^\//, '')}`;
        lines.push(`    await page.goto(${JSON.stringify(dest)});`);
        lines.push(`    await page.waitForLoadState('domcontentloaded');`);
        break;
      }
      case 'click':
      case 'clickAt':
        lines.push(`    await page.locator(${JSON.stringify(loc)}).click();`);
        break;
      case 'type':
      case 'sendKeys':
        lines.push(`    await page.locator(${JSON.stringify(loc)}).fill(${JSON.stringify(val)});`);
        break;
      case 'select':
        lines.push(`    await page.locator(${JSON.stringify(loc)}).selectOption(${JSON.stringify(val.replace(/^label=/, ''))});`);
        break;
      case 'check':
        lines.push(`    await page.locator(${JSON.stringify(loc)}).check();`);
        break;
      case 'uncheck':
        lines.push(`    await page.locator(${JSON.stringify(loc)}).uncheck();`);
        break;
      case 'submit':
        lines.push(`    await page.locator(${JSON.stringify(loc)}).press('Enter');`);
        break;
      case 'waitFor':
      case 'waitForElementPresent':
      case 'waitForElementVisible':
        lines.push(`    await page.locator(${JSON.stringify(loc)}).waitFor({ state: 'visible', timeout: 10000 });`);
        break;
      case 'pause':
      case 'wait':
        lines.push(`    await page.waitForTimeout(${parseInt(cmd.target || '1000') || 1000});`);
        break;
      case 'assertText':
      case 'verifyText':
        lines.push(`    await expect(page.locator(${JSON.stringify(loc)})).toHaveText(${JSON.stringify(val)});`);
        break;
      case 'assertElementPresent':
      case 'verifyElementPresent':
        lines.push(`    await expect(page.locator(${JSON.stringify(loc)})).toBeVisible();`);
        break;
      case 'executeScript':
      case 'runScript':
        lines.push(`    await page.evaluate(() => { ${cmd.target} });`);
        break;
      default:
        lines.push(`    // [Notice] Unmapped Selenium command: ${cmd.command} (Target: ${cmd.target || 'none'})`);
    }
  });

  lines.push(`  });`);
  lines.push(`});`);
  return lines.join('\n');
}

function convertToPlaywrightPython(project: SideProject, testIndex = 0): string {
  const test = project.tests[testIndex] || project.tests[0];
  if (!test) return '# No test found in .side project';

  const baseUrl = project.url || 'https://example.com';
  let lines: string[] = [];

  lines.push(`from playwright.sync_api import Page, expect`);
  lines.push(``);
  lines.push(`def test_${(test.name || 'flow').toLowerCase().replace(/[^a-z0-9_]/g, '_')}(page: Page):`);
  lines.push(`    """Generated from Selenium IDE by FlowMacro Converter"""`);

  test.commands.forEach((cmd, idx) => {
    lines.push(`    # Step ${idx + 1}: ${cmd.command.toUpperCase()}`);
    const loc = cleanLocator(cmd.target || '');
    const val = cmd.value || '';

    switch (cmd.command) {
      case 'open': {
        const dest = cmd.target?.startsWith('http') ? cmd.target : `${baseUrl.replace(/\/$/, '')}/${(cmd.target || '').replace(/^\//, '')}`;
        lines.push(`    page.goto(${JSON.stringify(dest)})`);
        lines.push(`    page.wait_for_load_state('domcontentloaded')`);
        break;
      }
      case 'click':
      case 'clickAt':
        lines.push(`    page.locator(${JSON.stringify(loc)}).click()`);
        break;
      case 'type':
      case 'sendKeys':
        lines.push(`    page.locator(${JSON.stringify(loc)}).fill(${JSON.stringify(val)})`);
        break;
      case 'select':
        lines.push(`    page.locator(${JSON.stringify(loc)}).select_option(label=${JSON.stringify(val.replace(/^label=/, ''))})`);
        break;
      case 'submit':
        lines.push(`    page.locator(${JSON.stringify(loc)}).press('Enter')`);
        break;
      case 'waitFor':
        lines.push(`    page.locator(${JSON.stringify(loc)}).wait_for(state='visible')`);
        break;
      case 'assertText':
        lines.push(`    expect(page.locator(${JSON.stringify(loc)})).to_have_text(${JSON.stringify(val)})`);
        break;
      default:
        lines.push(`    # Command: ${cmd.command} -> locator: ${loc}`);
    }
  });

  return lines.join('\n');
}

function convertToPythonSelenium(project: SideProject, testIndex = 0): string {
  const test = project.tests[testIndex] || project.tests[0];
  if (!test) return '# No test found';

  const baseUrl = project.url || 'https://example.com';
  let lines: string[] = [];

  lines.push(`import time`);
  lines.push(`from selenium import webdriver`);
  lines.push(`from selenium.webdriver.common.by import By`);
  lines.push(`from selenium.webdriver.support.ui import WebDriverWait`);
  lines.push(`from selenium.webdriver.support import expected_conditions as EC`);
  lines.push(``);
  lines.push(`driver = webdriver.Chrome()`);
  lines.push(`wait = WebDriverWait(driver, 10)`);
  lines.push(`try:`);

  test.commands.forEach((cmd, idx) => {
    lines.push(`    # Step ${idx + 1}: ${cmd.command.toUpperCase()}`);
    const target = cmd.target || '';
    let by = 'By.CSS_SELECTOR';
    let sel = target;

    if (target.startsWith('id=')) { by = 'By.ID'; sel = target.replace(/^id=/, ''); }
    else if (target.startsWith('name=')) { by = 'By.NAME'; sel = target.replace(/^name=/, ''); }
    else if (target.startsWith('xpath=') || target.startsWith('//')) { by = 'By.XPATH'; sel = target.replace(/^xpath=/, ''); }
    else if (target.startsWith('css=')) { by = 'By.CSS_SELECTOR'; sel = target.replace(/^css=/, ''); }

    switch (cmd.command) {
      case 'open': {
        const dest = target.startsWith('http') ? target : `${baseUrl.replace(/\/$/, '')}/${target.replace(/^\//, '')}`;
        lines.push(`    driver.get(${JSON.stringify(dest)})`);
        break;
      }
      case 'click':
        lines.push(`    wait.until(EC.element_to_be_clickable((${by}, ${JSON.stringify(sel)}))).click()`);
        break;
      case 'type':
        lines.push(`    elem = wait.until(EC.visibility_of_element_located((${by}, ${JSON.stringify(sel)})))`);
        lines.push(`    elem.clear()`);
        lines.push(`    elem.send_keys(${JSON.stringify(cmd.value || '')})`);
        break;
      case 'pause':
      case 'wait':
        lines.push(`    time.sleep(${parseFloat(cmd.target || '1000') / 1000})`);
        break;
      default:
        lines.push(`    # ${cmd.command}: ${sel}`);
    }
  });

  lines.push(`finally:`);
  lines.push(`    driver.quit()`);
  return lines.join('\n');
}

export default function SideToPlaywrightConverter() {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [parsedProject, setParsedProject] = useState<SideProject | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'playwright-ts' | 'playwright-py' | 'selenium-py'>('playwright-ts');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedTestIdx, setSelectedTestIdx] = useState<number>(0);

  const handleParse = (rawText: string) => {
    setErrorMsg('');
    try {
      if (!rawText.trim()) {
        setParsedProject(null);
        return;
      }
      const data = JSON.parse(rawText) as SideProject;
      if (!data.tests || !Array.isArray(data.tests)) {
        throw new Error("Invalid .side format. Expected a 'tests' array.");
      }
      setParsedProject(data);
      setSelectedTestIdx(0);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to parse JSON file.');
      setParsedProject(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonInput(content);
      handleParse(content);
    };
    reader.readAsText(file);
  };

  const loadSample = () => {
    const raw = JSON.stringify(SAMPLE_SIDE_PROJECT, null, 2);
    setJsonInput(raw);
    handleParse(raw);
  };

  const getOutputCode = (): string => {
    if (!parsedProject) return '// Upload or paste a Selenium IDE (.side) JSON to generate modern automation code.';
    if (selectedLanguage === 'playwright-ts') return convertToPlaywrightTS(parsedProject, selectedTestIdx);
    if (selectedLanguage === 'playwright-py') return convertToPlaywrightPython(parsedProject, selectedTestIdx);
    if (selectedLanguage === 'selenium-py') return convertToPythonSelenium(parsedProject, selectedTestIdx);
    return '';
  };

  const handleCopy = () => {
    const code = getOutputCode();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const code = getOutputCode();
    const ext = selectedLanguage === 'playwright-ts' ? 'spec.ts' : 'py';
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `converted_test.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
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
            <span className="text-emerald-400 text-sm font-mono font-medium">.side to Playwright Converter</span>
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
            100% Client-Side • Zero Data Uploaded to Servers
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Convert <span className="text-emerald-400">Selenium IDE (.side)</span> to Playwright & Python
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Stranded with legacy <code>.side</code> files after Chrome removed Selenium IDE? Drop your project file below to generate clean, modern, asynchronous Playwright or Python scripts instantly.
          </p>
        </div>

        {/* Converter Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Left: Input Pane */}
          <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-mono text-sm font-semibold">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span>1. Upload or Paste .side JSON</span>
              </div>
              <button
                onClick={loadSample}
                className="text-xs font-mono text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Load Sample Project
              </button>
            </div>

            {/* Dropzone / Upload button */}
            <div className="relative border-2 border-dashed border-slate-700/80 rounded-lg p-6 text-center hover:border-emerald-500/50 transition-colors bg-slate-900/40 group">
              <input
                type="file"
                accept=".side,.json"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2 group-hover:text-emerald-400 transition-colors" />
              <p className="text-sm font-mono text-slate-300 font-medium">Click to upload .side file or drag & drop</p>
              <p className="text-xs text-slate-500 mt-1">Supports official Selenium IDE v2.0 JSON projects</p>
            </div>

            {/* Raw JSON textarea */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400 flex items-center justify-between">
                <span>Or paste raw JSON directly:</span>
                {parsedProject && (
                  <span className="text-emerald-400">
                    ✓ Parsed {parsedProject.tests.length} Test{parsedProject.tests.length > 1 ? 's' : ''}
                  </span>
                )}
              </label>
              <textarea
                value={jsonInput}
                onChange={(e) => {
                  setJsonInput(e.target.value);
                  handleParse(e.target.value);
                }}
                placeholder='Paste {"id": "...", "version": "2.0", "tests": [...]} here...'
                rows={12}
                className="w-full bg-[#090d14] border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-300 focus:outline-none focus:border-emerald-500/60 transition-colors resize-y"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Test Selector if multiple tests */}
            {parsedProject && parsedProject.tests.length > 1 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <label className="text-xs font-mono text-slate-400">Select Test Case to Export:</label>
                <select
                  value={selectedTestIdx}
                  onChange={(e) => setSelectedTestIdx(Number(e.target.value))}
                  className="w-full bg-[#090d14] border border-slate-800 rounded-lg p-2 font-mono text-xs text-slate-200 focus:outline-none focus:border-emerald-500/60"
                >
                  {parsedProject.tests.map((t, idx) => (
                    <option key={t.id || idx} value={idx}>
                      {t.name || `Test ${idx + 1}`} ({t.commands.length} commands)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Right: Output Code Pane */}
          <div className="rounded-xl border border-slate-800 bg-[#0d131f] p-5 space-y-4 shadow-xl flex flex-col h-full">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-white font-mono text-sm font-semibold">
                <Code2 className="w-4 h-4 text-emerald-400" />
                <span>2. Generated Modern Code</span>
              </div>

              {/* Language Selector Tabs */}
              <div className="flex items-center rounded-lg bg-[#090d14] p-1 border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setSelectedLanguage('playwright-ts')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    selectedLanguage === 'playwright-ts'
                      ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Playwright (TS)
                </button>
                <button
                  onClick={() => setSelectedLanguage('playwright-py')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    selectedLanguage === 'playwright-py'
                      ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Playwright (Python)
                </button>
                <button
                  onClick={() => setSelectedLanguage('selenium-py')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    selectedLanguage === 'selenium-py'
                      ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Selenium (Python)
                </button>
              </div>
            </div>

            {/* Generated Code Window */}
            <div className="relative flex-1 min-h-[360px] bg-[#090d14] border border-slate-800 rounded-lg p-4 font-mono text-xs overflow-x-auto text-emerald-300/90 leading-relaxed">
              <pre className="whitespace-pre">{getOutputCode()}</pre>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-500 font-mono">
                {parsedProject ? (
                  <span>
                    ✓ Ready: {parsedProject.tests[selectedTestIdx]?.commands.length || 0} commands mapped
                  </span>
                ) : (
                  <span>Waiting for valid .side JSON input</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  disabled={!parsedProject}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-mono font-medium transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!parsedProject}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-mono font-bold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download File
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Value Proposition Callout Box */}
        <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-[#0d131f] to-slate-900/60 p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Stop Writing Scripts By Hand
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Record new workflows directly in Chrome with FlowMacro
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Selenium IDE is gone, but you don't need to write manual tests. FlowMacro automatically records user clicks, masks credentials with local AES-256 encryption, and uses a 5-tier selector waterfall so tests never flake.
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

        {/* Educational SEO & FAQ Section */}
        <section className="border-t border-slate-800/80 pt-10 space-y-6">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Frequently Asked Questions: Migrating from Selenium IDE to Playwright
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-mono text-slate-400">
            <div className="p-4 rounded-xl border border-slate-800 bg-[#0d131f] space-y-2">
              <h3 className="text-white font-semibold text-sm">Why did Selenium IDE stop working in Chrome?</h3>
              <p className="leading-relaxed">
                Google Chrome completely deprecated Manifest V2 extensions across 2024–2025. Because Selenium IDE relied on legacy background execution and dynamic eval scripts, it was removed from the Chrome Web Store.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-[#0d131f] space-y-2">
              <h3 className="text-white font-semibold text-sm">Are my .side files safe?</h3>
              <p className="leading-relaxed">
                Yes! Your <code>.side</code> files are standard JSON documents containing test steps, locators, and target URLs. They are completely independent of the browser and can be converted to Playwright or imported into FlowMacro anytime.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-[#0d131f] space-y-2">
              <h3 className="text-white font-semibold text-sm">Why should I migrate to Playwright?</h3>
              <p className="leading-relaxed">
                Playwright provides native auto-waiting (eliminating flaky <code>time.sleep</code> calls), multi-tab support, modern async/await syntax, and 3x faster CI/CD execution compared to legacy Selenium WebDriver.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-[#0d131f] space-y-2">
              <h3 className="text-white font-semibold text-sm">Can I record new tests in Chrome directly?</h3>
              <p className="leading-relaxed">
                Yes. FlowMacro is the native Manifest V3 replacement for Selenium IDE. You can record web actions in Chrome, mask passwords with local AES-256 encryption, and export clean Playwright code with zero setup.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
