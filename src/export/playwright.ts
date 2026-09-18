import { TestSuite, Macro } from '../types/macro';

function toPlaywrightLocator(target: string): string {
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
  if (target.startsWith('xpath=')) {
    return target.replace(/^xpath=/, '');
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

export function exportToPlaywright(input: TestSuite | Macro): string {
  const suite = normalizeToTestSuite(input);
  const hasSensitive = suite.commands.some((c) => c.isSensitive);

  const envHeader = hasSensitive
    ? `  // Secure Environment Credentials\n  const AUTO_MACRO_PASSWORD = process.env.AUTO_MACRO_PASSWORD || '';\n\n`
    : '';

  const stepLines = suite.commands
    .map((cmd, idx) => {
      let code = `  // Step ${idx + 1}: ${cmd.command.toUpperCase()} ${cmd.target || ''}\n`;
      const locatorStr = JSON.stringify(toPlaywrightLocator(cmd.target || ''));

      let valExpr = cmd.value ? JSON.stringify(cmd.value) : "''";
      if (cmd.isSensitive) {
        valExpr = 'AUTO_MACRO_PASSWORD';
      }

      switch (cmd.command) {
        case 'open':
          code += `  await page.goto(${JSON.stringify(cmd.target || suite.baseUrl || 'https://example.com')});\n  await page.waitForLoadState('domcontentloaded');`;
          break;

        case 'click':
          code += `  await page.locator(${locatorStr}).click();`;
          break;

        case 'type':
          code += `  await page.locator(${locatorStr}).fill(${valExpr});`;
          break;

        case 'select': {
          const val = cmd.value?.startsWith('label=')
            ? JSON.stringify(cmd.value.replace(/^label=/, ''))
            : valExpr;
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

  return `import { test, expect } from '@playwright/test';

/**
 * AutoMacro Generated Playwright Test
 * Suite: ${suite.name || 'Test Suite'}
 * Base URL: ${suite.baseUrl || 'https://example.com'}
 * Generated: ${new Date().toISOString()}
 */
test('${(suite.name || 'Test Suite').replace(/'/g, "\\'")}', async ({ page }) => {
${envHeader}${stepLines}
});
`;
}
