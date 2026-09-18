import { TestSuite, Macro } from '../types/macro';

function toPuppeteerSelector(target: string): string {
  if (!target) return 'body';
  if (target.startsWith('id=')) {
    return `#${target.replace(/^id=/, '')}`;
  }
  if (target.startsWith('name=')) {
    return `[name="${target.replace(/^name=/, '')}"]`;
  }
  if (target.startsWith('css=')) {
    return target.replace(/^css=/, '');
  }
  return target;
}

function normalizeToTestSuite(input: TestSuite | Macro): TestSuite {
  if ('commands' in input) {
    return input;
  }
  return {
    id: input.macroId,
    name: input.title,
    baseUrl: input.baseUrl || 'https://example.com',
    commands: input.steps.map((s) => ({
      id: s.id,
      command: s.action as any,
      target: s.selector,
      value: s.value,
      status: 'pending',
      isSensitive: s.isSensitive,
      encryptedSecret: s.encryptedSecret,
      envVarName: s.envVarName,
    })),
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    variables: input.variables,
  };
}

export function exportToPuppeteer(input: TestSuite | Macro): string {
  const suite = normalizeToTestSuite(input);
  const hasSensitive = suite.commands.some((c) => c.isSensitive);

  const envHeader = hasSensitive
    ? `  const AUTO_MACRO_PASSWORD = process.env.AUTO_MACRO_PASSWORD || '';\n\n`
    : '';

  const stepLines = suite.commands
    .map((cmd, idx) => {
      let code = `  // Step ${idx + 1}: ${cmd.command.toUpperCase()} ${cmd.target || ''}\n`;
      const sel = JSON.stringify(toPuppeteerSelector(cmd.target || ''));

      let valExpr = cmd.value ? JSON.stringify(cmd.value) : "''";
      if (cmd.isSensitive) {
        valExpr = 'AUTO_MACRO_PASSWORD';
      }

      switch (cmd.command) {
        case 'open':
          code += `  await page.goto(${JSON.stringify(cmd.target || suite.baseUrl || 'https://example.com')}, { waitUntil: 'networkidle2' });`;
          break;

        case 'click':
          code += `  await page.waitForSelector(${sel});\n  await page.click(${sel});`;
          break;

        case 'type':
          code += `  await page.waitForSelector(${sel});\n  await page.click(${sel}, { clickCount: 3 });\n  await page.type(${sel}, ${valExpr});`;
          break;

        case 'select': {
          const val = cmd.value?.startsWith('label=')
            ? JSON.stringify(cmd.value.replace(/^label=/, ''))
            : valExpr;
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

  return `const puppeteer = require('puppeteer');

/**
 * AutoMacro Generated Puppeteer Script
 * Suite: ${suite.name || 'Test Suite'}
 * Base URL: ${suite.baseUrl || 'https://example.com'}
 * Generated: ${new Date().toISOString()}
 */
(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

${envHeader}${stepLines}

  console.log('✅ AutoMacro execution completed!');
  await browser.close();
})();
`;
}
