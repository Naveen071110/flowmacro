// Verification test of exporter functions logic
function toPlaywrightLocator(target) {
  if (!target) return 'body';
  if (target.startsWith('id=')) return `#${target.replace(/^id=/, '')}`;
  if (target.startsWith('name=')) return `[name="${target.replace(/^name=/, '')}"]`;
  if (target.startsWith('css=')) return target.replace(/^css=/, '');
  if (target.startsWith('xpath=')) return target.replace(/^xpath=/, '');
  return target;
}

function toPuppeteerSelector(target) {
  if (!target) return 'body';
  if (target.startsWith('id=')) return `#${target.replace(/^id=/, '')}`;
  if (target.startsWith('name=')) return `[name="${target.replace(/^name=/, '')}"]`;
  if (target.startsWith('css=')) return target.replace(/^css=/, '');
  return target;
}

function toSeleniumLocator(target) {
  if (!target) return { by: 'By.TAG_NAME', selector: 'body' };
  if (target.startsWith('id=')) return { by: 'By.ID', selector: target.replace(/^id=/, '') };
  if (target.startsWith('name=')) return { by: 'By.NAME', selector: target.replace(/^name=/, '') };
  if (target.startsWith('css=')) return { by: 'By.CSS_SELECTOR', selector: target.replace(/^css=/, '') };
  if (target.startsWith('xpath=')) return { by: 'By.XPATH', selector: target.replace(/^xpath=/, '') };
  if (target.startsWith('//') || target.startsWith('(')) return { by: 'By.XPATH', selector: target };
  return { by: 'By.CSS_SELECTOR', selector: target };
}

function exportToPlaywright(suite) {
  const hasSensitive = suite.commands.some((c) => c.isSensitive);
  const envHeader = hasSensitive
    ? `  // Secure Environment Credentials\n  const AUTO_MACRO_PASSWORD = process.env.AUTO_MACRO_PASSWORD || '';\n\n`
    : '';

  const stepLines = suite.commands
    .map((cmd, idx) => {
      let code = `  // Step ${idx + 1}: ${cmd.command.toUpperCase()} ${cmd.target || ''}\n`;
      const locatorStr = JSON.stringify(toPlaywrightLocator(cmd.target || ''));
      let valExpr = cmd.value ? JSON.stringify(cmd.value) : "''";
      if (cmd.isSensitive) valExpr = 'AUTO_MACRO_PASSWORD';

      switch (cmd.command) {
        case 'open':
          code += `  await page.goto(${JSON.stringify(cmd.target || suite.baseUrl)});\n  await page.waitForLoadState('domcontentloaded');`;
          break;
        case 'click':
          code += `  await page.locator(${locatorStr}).click();`;
          break;
        case 'type':
          code += `  await page.locator(${locatorStr}).fill(${valExpr});`;
          break;
        case 'select': {
          const val = cmd.value?.startsWith('label=') ? JSON.stringify(cmd.value.replace(/^label=/, '')) : valExpr;
          code += `  await page.locator(${locatorStr}).selectOption(${val});`;
          break;
        }
        case 'submit':
          code += `  await page.locator(${locatorStr}).press('Enter');`;
          break;
        case 'waitFor':
          code += `  await page.locator(${locatorStr}).waitFor({ state: 'visible' });`;
          break;
        case 'wait':
          code += `  await page.waitForTimeout(${parseInt(cmd.target || '1000') || 1000});`;
          break;
        default:
          code += `  // Unsupported command: ${cmd.command}`;
      }
      return code;
    })
    .join('\n\n');

  return `import { test, expect } from '@playwright/test';\n\ntest('${(suite.name || 'Test Suite').replace(/'/g, "\\'")}', async ({ page }) => {\n${envHeader}${stepLines}\n});\n`;
}

function exportToPuppeteer(suite) {
  const hasSensitive = suite.commands.some((c) => c.isSensitive);
  const envHeader = hasSensitive ? `  const AUTO_MACRO_PASSWORD = process.env.AUTO_MACRO_PASSWORD || '';\n\n` : '';

  const stepLines = suite.commands
    .map((cmd, idx) => {
      let code = `  // Step ${idx + 1}: ${cmd.command.toUpperCase()} ${cmd.target || ''}\n`;
      const sel = JSON.stringify(toPuppeteerSelector(cmd.target || ''));
      let valExpr = cmd.value ? JSON.stringify(cmd.value) : "''";
      if (cmd.isSensitive) valExpr = 'AUTO_MACRO_PASSWORD';

      switch (cmd.command) {
        case 'open':
          code += `  await page.goto(${JSON.stringify(cmd.target || suite.baseUrl)}, { waitUntil: 'networkidle2' });`;
          break;
        case 'click':
          code += `  await page.waitForSelector(${sel});\n  await page.click(${sel});`;
          break;
        case 'type':
          code += `  await page.waitForSelector(${sel});\n  await page.click(${sel}, { clickCount: 3 });\n  await page.type(${sel}, ${valExpr});`;
          break;
        case 'select': {
          const val = cmd.value?.startsWith('label=') ? JSON.stringify(cmd.value.replace(/^label=/, '')) : valExpr;
          code += `  await page.waitForSelector(${sel});\n  await page.select(${sel}, ${val});`;
          break;
        }
        case 'submit':
          code += `  await page.waitForSelector(${sel});\n  await page.focus(${sel});\n  await page.keyboard.press('Enter');`;
          break;
        case 'waitFor':
          code += `  await page.waitForSelector(${sel}, { visible: true });`;
          break;
        case 'wait':
          code += `  await new Promise((r) => setTimeout(r, ${parseInt(cmd.target || '1000') || 1000}));`;
          break;
        default:
          code += `  // Unsupported command: ${cmd.command}`;
      }
      return code;
    })
    .join('\n\n');

  return `const puppeteer = require('puppeteer');\n\n(async () => {\n  const browser = await puppeteer.launch({ headless: false });\n  const page = await browser.newPage();\n${envHeader}${stepLines}\n  await browser.close();\n})();\n`;
}

function exportToSelenium(suite) {
  const hasSensitive = suite.commands.some((c) => c.isSensitive);
  const envHeader = hasSensitive ? `    AUTO_MACRO_PASSWORD = os.getenv('AUTO_MACRO_PASSWORD', '')\n\n` : '';

  const stepLines = suite.commands
    .map((cmd, idx) => {
      let code = `    # Step ${idx + 1}: ${cmd.command.toUpperCase()} ${cmd.target || ''}\n`;
      const { by, selector } = toSeleniumLocator(cmd.target || '');
      const selEscaped = JSON.stringify(selector);
      let valExpr = cmd.value ? JSON.stringify(cmd.value) : "''";
      if (cmd.isSensitive) valExpr = 'AUTO_MACRO_PASSWORD';

      switch (cmd.command) {
        case 'open':
          code += `    driver.get(${JSON.stringify(cmd.target || suite.baseUrl)})`;
          break;
        case 'click':
          code += `    elem = wait.until(EC.element_to_be_clickable((${by}, ${selEscaped})))\n    elem.click()`;
          break;
        case 'type':
          code += `    elem = wait.until(EC.visibility_of_element_located((${by}, ${selEscaped})))\n    elem.clear()\n    elem.send_keys(${valExpr})`;
          break;
        case 'select': {
          code += `    from selenium.webdriver.support.ui import Select\n`;
          code += `    elem = wait.until(EC.presence_of_element_located((${by}, ${selEscaped})))\n`;
          if (cmd.value?.startsWith('label=')) {
            code += `    Select(elem).select_by_visible_text(${JSON.stringify(cmd.value.replace(/^label=/, ''))})`;
          } else {
            code += `    Select(elem).select_by_value(${valExpr})`;
          }
          break;
        }
        case 'submit':
          code += `    elem = wait.until(EC.presence_of_element_located((${by}, ${selEscaped})))\n    elem.send_keys(Keys.ENTER)`;
          break;
        case 'waitFor':
          code += `    wait.until(EC.visibility_of_element_located((${by}, ${selEscaped})))`;
          break;
        case 'wait':
          code += `    time.sleep(${(parseInt(cmd.target || '1000') || 1000) / 1000})`;
          break;
        default:
          code += `    # Unsupported command: ${cmd.command}`;
      }
      return code;
    })
    .join('\n\n');

  return `import os, time\nfrom selenium import webdriver\nfrom selenium.webdriver.common.by import By\nfrom selenium.webdriver.common.keys import Keys\nfrom selenium.webdriver.support.ui import WebDriverWait\nfrom selenium.webdriver.support import expected_conditions as EC\n\ndef run_test():\n    driver = webdriver.Chrome()\n    wait = WebDriverWait(driver, 10)\n    try:\n${envHeader}${stepLines}\n    finally:\n        driver.quit()\n`;
}

function exportToSeleniumSide(suite) {
  const testId = suite.id || 'test_' + Date.now();
  const suiteId = 'suite_' + Date.now();

  const formattedCommands = suite.commands.map((cmd) => {
    let target = cmd.target || '';
    if (cmd.command === 'open' && suite.baseUrl) {
      try {
        const urlObj = new URL(cmd.target);
        const baseObj = new URL(suite.baseUrl);
        if (urlObj.origin === baseObj.origin) {
          target = urlObj.pathname + urlObj.search + urlObj.hash || '/';
        }
      } catch {}
    }

    let value = cmd.value || '';
    if (cmd.isSensitive) value = '{{SECRET_PASSWORD}}';

    return {
      id: cmd.id,
      comment: cmd.comment || '',
      command: cmd.command,
      target,
      targets: cmd.targets && cmd.targets.length > 0 ? cmd.targets : [[target, 'css:finder']],
      value,
    };
  });

  return JSON.stringify({
    id: 'project_' + Date.now(),
    version: '2.0',
    name: suite.name || 'AutoMacro Project',
    url: suite.baseUrl || 'https://example.com',
    tests: [{ id: testId, name: suite.name || 'Test', commands: formattedCommands }],
    suites: [{ id: suiteId, name: 'Default Suite', persistSession: false, parallel: false, timeout: 300, tests: [testId] }],
    urls: [suite.baseUrl || 'https://example.com'],
    plugins: [],
  }, null, 2);
}

// Test Suite Data
const sampleSuite = {
  id: 'test_1',
  name: 'Login Form Test',
  baseUrl: 'https://example.com',
  commands: [
    { id: 'c1', command: 'open', target: 'https://example.com/login', status: 'passed' },
    { id: 'c2', command: 'type', target: 'css=[data-testid="email"]', value: 'admin@corp.io', status: 'passed' },
    { id: 'c3', command: 'type', target: 'id=pass', value: 'PlainTextSecretPassword!', sessionSecret: 'PlainTextSecretPassword!', isSensitive: true, status: 'passed' },
    { id: 'c4', command: 'click', target: 'css=[aria-label="Sign In"]', status: 'passed' },
    { id: 'c5', command: 'waitFor', target: 'css=.dashboard', status: 'passed' },
  ],
};

console.log('Testing Exporters with AUTO_MACRO_PASSWORD verification...');
const pw = exportToPlaywright(sampleSuite);
const pup = exportToPuppeteer(sampleSuite);
const py = exportToSelenium(sampleSuite);
const side = exportToSeleniumSide(sampleSuite);

if (pw.includes('PlainTextSecretPassword!') || pup.includes('PlainTextSecretPassword!') || py.includes('PlainTextSecretPassword!') || side.includes('PlainTextSecretPassword!')) {
  console.error('FAIL: Plain text password leaked!');
  process.exit(1);
}

if (!pw.includes('AUTO_MACRO_PASSWORD') || !pup.includes('AUTO_MACRO_PASSWORD') || !py.includes('AUTO_MACRO_PASSWORD') || !side.includes('{{SECRET_PASSWORD}}')) {
  console.error('FAIL: AUTO_MACRO_PASSWORD variable missing!');
  process.exit(1);
}

console.log('PASS: All exporters generated clean, sanitized code with process.env.AUTO_MACRO_PASSWORD & os.getenv("AUTO_MACRO_PASSWORD")!');
