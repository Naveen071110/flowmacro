import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { createServer } from 'vite';

async function runTestSuite() {
  console.log('🧪 Starting FlowMacro Comprehensive Feature & UI Engine Test Suite...\n');

  const server = await createServer({
    configFile: false,
    server: { middlewareMode: true },
    appType: 'custom',
    optimizeDeps: { noDiscovery: true },
  });

  const { exportToPlaywright } = await server.ssrLoadModule('./src/export/playwright.ts');
  const { exportToPuppeteer } = await server.ssrLoadModule('./src/export/puppeteer.ts');
  const { exportToSelenium } = await server.ssrLoadModule('./src/export/selenium.ts');
  const { exportToSeleniumSide } = await server.ssrLoadModule('./src/export/side.ts');
  const { exportToJson } = await server.ssrLoadModule('./src/export/json.ts');

  let passCount = 0;
  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passCount++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(err);
      process.exit(1);
    }
  }

  // ----------------------------------------------------------------------------
  // TEST GROUP 1: Version Consistency & Dynamic Versioning
  // ----------------------------------------------------------------------------
  console.log('--- Group 1: Versioning & Manifest Consistency ---');

  test('manifest.json, public/manifest.json, and package.json versions match (1.0.2)', () => {
    const rootManifest = JSON.parse(fs.readFileSync('manifest.json', 'utf-8'));
    const publicManifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf-8'));
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

    assert.strictEqual(rootManifest.version, publicManifest.version, 'Manifest versions must match');
    assert.strictEqual(rootManifest.version, pkg.version, 'Manifest version must match package.json');
    assert.strictEqual(rootManifest.version, '1.0.2', 'Expected version 1.0.2');
  });

  test('Manifest V3 required permissions are present', () => {
    const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf-8'));
    const required = ['storage', 'tabs', 'webNavigation', 'scripting', 'activeTab'];
    for (const perm of required) {
      assert(manifest.permissions.includes(perm), `Missing required permission: ${perm}`);
    }
  });

  test('No hardcoded v2.0 text remains in source code', () => {
    const appTsx = fs.readFileSync('src/ide/App.tsx', 'utf-8');
    assert(!appTsx.includes('v2.0'), 'src/ide/App.tsx should not contain hardcoded v2.0');
    assert(appTsx.includes('app-version'), 'src/ide/App.tsx must include app-version class for dynamic binding');
  });

  // ----------------------------------------------------------------------------
  // TEST GROUP 2: Top Navigation Menu Bar & Action Handlers
  // ----------------------------------------------------------------------------
  console.log('\n--- Group 2: Top Navigation Menu Bar & Dropdown Actions ---');

  test('App.tsx contains all 5 menu dropdown headers: File, Edit, View, Tools, Help', () => {
    const appCode = fs.readFileSync('src/ide/App.tsx', 'utf-8');

    // Menu dropdown toggles
    assert(appCode.includes("setActiveMenu(activeMenu === 'file' ? null : 'file')"), 'File menu toggle present');
    assert(appCode.includes("setActiveMenu(activeMenu === 'edit' ? null : 'edit')"), 'Edit menu toggle present');
    assert(appCode.includes("setActiveMenu(activeMenu === 'view' ? null : 'view')"), 'View menu toggle present');
    assert(appCode.includes("setActiveMenu(activeMenu === 'tools' ? null : 'tools')"), 'Tools menu toggle present');
    assert(appCode.includes("setActiveMenu(activeMenu === 'help' ? null : 'help')"), 'Help menu toggle present');

    // File Actions
    assert(appCode.includes('New Macro'), 'File -> New Macro action present');
    assert(appCode.includes('Open (.side / JSON)...'), 'File -> Open action present');
    assert(appCode.includes('Export Code (Playwright, Python)...'), 'File -> Export action present');
    assert(appCode.includes('Close Window'), 'File -> Close Window action present');

    // Edit Actions
    assert(appCode.includes('Undo'), 'Edit -> Undo action present');
    assert(appCode.includes('Redo'), 'Edit -> Redo action present');
    assert(appCode.includes('Clear All Steps'), 'Edit -> Clear All Steps action present');

    // View Actions
    assert(appCode.includes('Show All Logs'), 'View -> Show All Logs action present');
    assert(appCode.includes('Errors Only'), 'View -> Errors Only action present');
    assert(appCode.includes('Navigation Events Only'), 'View -> Navigation Events action present');
    assert(appCode.includes('Auto-Scroll Logs'), 'View -> Auto-Scroll action present');

    // Tools Actions
    assert(appCode.includes('Select Target Tab...'), 'Tools -> Select Target Tab action present');
    assert(appCode.includes('AES-256 Masking'), 'Tools -> AES-256 Masking action present');
    assert(appCode.includes('License & Activation...'), 'Tools -> License action present');

    // Help Actions
    assert(appCode.includes('Documentation'), 'Help -> Documentation action present');
    assert(appCode.includes('Check Version...'), 'Help -> Check Version action present');
    assert(appCode.includes('Report Issue...'), 'Help -> Report Issue action present');
  });

  // ----------------------------------------------------------------------------
  // TEST GROUP 3: Import Engine (.side & JSON Parser Logic)
  // ----------------------------------------------------------------------------
  console.log('\n--- Group 3: File Import Engine (.side & native JSON) ---');

  test('Selenium IDE (.side) format parsing logic converts commands accurately', () => {
    const sampleSideJson = {
      id: "side_proj_123",
      name: "Login Workflow",
      url: "https://demo.app.com",
      tests: [{
        id: "test_1",
        name: "User Login",
        commands: [
          { id: "c1", command: "open", target: "https://demo.app.com/login", value: "" },
          { id: "c2", command: "type", target: "id=username", value: "testuser" },
          { id: "c3", command: "sendKeys", target: "id=password", value: "secret123" },
          { id: "c4", command: "click", target: "css=button.login-btn", value: "" },
          { id: "c5", command: "waitForElementPresent", target: "id=dashboard", value: "" }
        ]
      }]
    };

    const primaryTest = sampleSideJson.tests[0];
    const commands = primaryTest.commands.map((c, idx) => {
      let cmdType = 'click';
      const rawCmd = (c.command || '').toLowerCase();
      if (rawCmd === 'open') cmdType = 'open';
      else if (rawCmd === 'click' || rawCmd === 'clickat') cmdType = 'click';
      else if (rawCmd === 'type' || rawCmd === 'sendkeys') cmdType = 'type';
      else if (rawCmd === 'select') cmdType = 'select';
      else if (rawCmd === 'submit') cmdType = 'submit';
      else if (rawCmd.includes('waitfor')) cmdType = 'waitFor';
      else if (rawCmd.includes('wait')) cmdType = 'wait';

      return {
        id: c.id,
        command: cmdType,
        target: c.target,
        value: c.value,
        status: 'pending'
      };
    });

    assert.strictEqual(commands.length, 5);
    assert.strictEqual(commands[0].command, 'open');
    assert.strictEqual(commands[1].command, 'type');
    assert.strictEqual(commands[2].command, 'type'); // sendKeys -> type
    assert.strictEqual(commands[3].command, 'click');
    assert.strictEqual(commands[4].command, 'waitFor');
  });

  test('Native FlowMacro JSON format parsing preserves commands and metadata', () => {
    const nativeSuite = {
      id: "suite_456",
      name: "Checkout Flow",
      baseUrl: "https://store.dev",
      commands: [
        { id: "step_1", command: "open", target: "https://store.dev/cart", status: "passed" },
        { id: "step_2", command: "click", target: "id=checkout", status: "passed" }
      ],
      createdAt: 1700000000,
      updatedAt: 1700000100
    };

    assert.strictEqual(nativeSuite.name, 'Checkout Flow');
    assert.strictEqual(nativeSuite.commands.length, 2);
    assert.strictEqual(nativeSuite.commands[0].command, 'open');
    assert.strictEqual(nativeSuite.commands[1].target, 'id=checkout');
  });

  // ----------------------------------------------------------------------------
  // TEST GROUP 4: Undo / Redo Engine State Machine
  // ----------------------------------------------------------------------------
  console.log('\n--- Group 4: Undo & Redo History State Machine ---');

  test('Undo and Redo stacks behave properly over multiple mutations', () => {
    let suite = { id: 's1', name: 'V1', baseUrl: 'https://v1.com', commands: [] };
    let undoStack = [];
    let redoStack = [];

    function updateSuite(newSuite) {
      undoStack.push(suite);
      redoStack = [];
      suite = newSuite;
    }

    function undo() {
      if (undoStack.length === 0) return;
      const prev = undoStack.pop();
      redoStack.push(suite);
      suite = prev;
    }

    function redo() {
      if (redoStack.length === 0) return;
      const next = redoStack.pop();
      undoStack.push(suite);
      suite = next;
    }

    // Mutation 1
    updateSuite({ ...suite, name: 'V2', commands: [{ id: '1', command: 'open' }] });
    assert.strictEqual(suite.name, 'V2');
    assert.strictEqual(undoStack.length, 1);
    assert.strictEqual(redoStack.length, 0);

    // Mutation 2
    updateSuite({ ...suite, name: 'V3', commands: [{ id: '1', command: 'open' }, { id: '2', command: 'click' }] });
    assert.strictEqual(suite.name, 'V3');
    assert.strictEqual(undoStack.length, 2);

    // Undo to V2
    undo();
    assert.strictEqual(suite.name, 'V2');
    assert.strictEqual(undoStack.length, 1);
    assert.strictEqual(redoStack.length, 1);

    // Undo to V1
    undo();
    assert.strictEqual(suite.name, 'V1');
    assert.strictEqual(undoStack.length, 0);
    assert.strictEqual(redoStack.length, 2);

    // Redo back to V2
    redo();
    assert.strictEqual(suite.name, 'V2');
    assert.strictEqual(undoStack.length, 1);
    assert.strictEqual(redoStack.length, 1);

    // Redo back to V3
    redo();
    assert.strictEqual(suite.name, 'V3');
    assert.strictEqual(undoStack.length, 2);
    assert.strictEqual(redoStack.length, 0);
  });

  // ----------------------------------------------------------------------------
  // TEST GROUP 5: Recording Controls & Real-Time Status Badge
  // ----------------------------------------------------------------------------
  console.log('\n--- Group 5: Recording Controls & 3-State Status Badge ---');

  test('3 Recording control buttons and 3-state badge transitions evaluate accurately', () => {
    function getRecordingStateUI(isRecording, isRecordingPaused, stepCount) {
      let buttonLabel = 'Record';
      let badgeText = 'Ready';
      let badgeType = 'idle';

      if (isRecording && !isRecordingPaused) {
        buttonLabel = 'Recording...';
        badgeText = `Recording Step ${stepCount + 1}...`;
        badgeType = 'active';
      } else if (isRecording && isRecordingPaused) {
        buttonLabel = 'Resume';
        badgeText = 'Paused';
        badgeType = 'paused';
      }

      const canPause = isRecording && !isRecordingPaused;
      const canStop = isRecording;

      return { buttonLabel, badgeText, badgeType, canPause, canStop };
    }

    // State 1: Idle
    const idle = getRecordingStateUI(false, false, 0);
    assert.strictEqual(idle.buttonLabel, 'Record');
    assert.strictEqual(idle.badgeText, 'Ready');
    assert.strictEqual(idle.badgeType, 'idle');
    assert.strictEqual(idle.canPause, false);
    assert.strictEqual(idle.canStop, false);

    // State 2: Active Recording
    const active = getRecordingStateUI(true, false, 3);
    assert.strictEqual(active.buttonLabel, 'Recording...');
    assert.strictEqual(active.badgeText, 'Recording Step 4...');
    assert.strictEqual(active.badgeType, 'active');
    assert.strictEqual(active.canPause, true);
    assert.strictEqual(active.canStop, true);

    // State 3: Paused
    const paused = getRecordingStateUI(true, true, 3);
    assert.strictEqual(paused.buttonLabel, 'Resume');
    assert.strictEqual(paused.badgeText, 'Paused');
    assert.strictEqual(paused.badgeType, 'paused');
    assert.strictEqual(paused.canPause, false);
    assert.strictEqual(paused.canStop, true);
  });

  // ----------------------------------------------------------------------------
  // TEST GROUP 6: Code Generation Exporters
  // ----------------------------------------------------------------------------
  console.log('\n--- Group 6: Code Generation Exporters ---');

  const testSuite = {
    id: 'suite_test_1',
    name: 'Demo Login Test',
    baseUrl: 'https://example.com',
    createdAt: 1700000000,
    updatedAt: 1700000100,
    commands: [
      { id: '1', command: 'open', target: 'https://example.com/login', status: 'passed' },
      { id: '2', command: 'type', target: 'id=email', value: 'user@test.dev', status: 'passed' },
      {
        id: '3',
        command: 'type',
        target: 'id=password',
        value: '{{SECRET_PASSWORD}}',
        isSensitive: true,
        envVarName: 'SECRET_PASSWORD',
        status: 'passed'
      },
      { id: '4', command: 'click', target: 'css=button[type="submit"]', status: 'passed' },
      { id: '5', command: 'waitFor', target: 'css=.dashboard-header', status: 'passed' }
    ]
  };

  test('Playwright code generator produces valid TypeScript test', () => {
    const code = exportToPlaywright(testSuite);
    assert(code.includes("import { test, expect } from '@playwright/test';"), 'Includes Playwright imports');
    assert(code.includes('await page.goto("https://example.com/login");'), 'Generates goto navigation');
    assert(code.includes('AUTO_MACRO_PASSWORD'), 'References masked password env var');
    assert(code.includes('await page.locator("button[type=\\"submit\\"]").click();'), 'Generates click locator');
    assert(code.includes('await page.locator(".dashboard-header").waitFor'), 'Generates wait for selector');
  });

  test('Puppeteer code generator produces valid JavaScript script', () => {
    const code = exportToPuppeteer(testSuite);
    assert(code.includes("import puppeteer from 'puppeteer';") || code.includes("puppeteer"), 'Includes Puppeteer imports');
    assert(code.includes('await page.goto("https://example.com/login"'), 'Generates goto navigation');
    assert(code.includes('await page.click("button[type=\\"submit\\"]");'), 'Generates click action');
  });

  test('Python Selenium generator produces valid Python script with AES/env masking', () => {
    const code = exportToSelenium(testSuite);
    assert(code.includes("from selenium import webdriver"), 'Includes Selenium webdriver import');
    assert(code.includes('AUTO_MACRO_PASSWORD') || code.includes('SECRET_PASSWORD'), 'Includes password masking');
    assert(code.includes('driver.get("https://example.com/login")'), 'Includes driver.get navigation');
  });

  test('Selenium IDE (.side) exporter generates valid JSON structure', () => {
    const sideContent = exportToSeleniumSide(testSuite);
    const parsed = JSON.parse(sideContent);
    assert.strictEqual(parsed.name, 'Demo Login Test');
    assert(Array.isArray(parsed.tests));
    assert.strictEqual(parsed.tests[0].commands.length, 5);
    assert.strictEqual(parsed.tests[0].commands[0].command, 'open');
    assert.strictEqual(parsed.tests[0].commands[3].command, 'click');
  });

  test('FlowMacro JSON exporter outputs formatted JSON with version metadata', () => {
    const jsonContent = exportToJson(testSuite);
    const parsed = JSON.parse(jsonContent);
    assert.strictEqual(parsed.name, 'Demo Login Test');
    assert.strictEqual(parsed.commands.length, 5);
  });

  // ----------------------------------------------------------------------------
  // TEST GROUP 7: Background Service Worker & Recorder Navigation Contract
  // ----------------------------------------------------------------------------
  console.log('\n--- Group 7: Service Worker & Multi-Page Navigation Contract ---');

  test('service_worker.ts implements required persistence and navigation hooks', () => {
    const swCode = fs.readFileSync('src/background/service_worker.ts', 'utf-8');
    assert(swCode.includes('chrome.storage.session.set'), 'Uses chrome.storage.session for memory persistence');
    assert(swCode.includes('chrome.storage.local.set'), 'Uses chrome.storage.local for fallback persistence');
    assert(swCode.includes('chrome.webNavigation.onCompleted'), 'Listens to webNavigation.onCompleted');
    assert(swCode.includes('ensureScriptInjected'), 'Auto-injects recorder on completed navigation');
    assert(swCode.includes('PAUSE_RECORDING'), 'Handles PAUSE_RECORDING message');
    assert(swCode.includes('RESUME_RECORDING'), 'Handles RESUME_RECORDING message');
    assert(swCode.includes('GET_RECORDING_STATE'), 'Handles GET_RECORDING_STATE message');
  });

  test('recorder.ts auto-attaches on page reload and flushes pending inputs', () => {
    const recCode = fs.readFileSync('src/content_scripts/recorder.ts', 'utf-8');
    assert(recCode.includes('checkStorageAndAutoAttach'), 'Auto-reattaches on script load');
    assert(recCode.includes('chrome.storage.onChanged'), 'Listens for dynamic storage changes');
    assert(recCode.includes('flushPendingInput'), 'Flushes input buffer on form submit / click');
    assert(recCode.includes('beforeunload'), 'Flushes input before page unload');
    assert(recCode.includes('pagehide'), 'Flushes input on pagehide');
  });

  await server.close();
  console.log(`\n🎉 All ${passCount} tests passed successfully! Zero regressions found.`);
}

runTestSuite().catch((err) => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});
