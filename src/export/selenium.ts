import { TestSuite, Macro } from '../types/macro';

function toSeleniumLocator(target: string): { by: string; selector: string } {
  if (!target) return { by: 'By.TAG_NAME', selector: 'body' };
  if (target.startsWith('id=')) {
    return { by: 'By.ID', selector: target.replace(/^id=/, '') };
  }
  if (target.startsWith('name=')) {
    return { by: 'By.NAME', selector: target.replace(/^name=/, '') };
  }
  if (target.startsWith('css=')) {
    return { by: 'By.CSS_SELECTOR', selector: target.replace(/^css=/, '') };
  }
  if (target.startsWith('xpath=')) {
    return { by: 'By.XPATH', selector: target.replace(/^xpath=/, '') };
  }
  if (target.startsWith('//') || target.startsWith('(')) {
    return { by: 'By.XPATH', selector: target };
  }
  return { by: 'By.CSS_SELECTOR', selector: target };
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

export function exportToSelenium(input: TestSuite | Macro): string {
  const suite = normalizeToTestSuite(input);
  const hasSensitive = suite.commands.some((c) => c.isSensitive);

  const envHeader = hasSensitive
    ? `    AUTO_MACRO_PASSWORD = os.getenv('AUTO_MACRO_PASSWORD', '')\n\n`
    : '';

  const stepLines = suite.commands
    .map((cmd, idx) => {
      let code = `    # Step ${idx + 1}: ${cmd.command.toUpperCase()} ${cmd.target || ''}\n`;
      const { by, selector } = toSeleniumLocator(cmd.target || '');
      const selEscaped = JSON.stringify(selector);

      let valExpr = cmd.value ? JSON.stringify(cmd.value) : "''";
      if (cmd.isSensitive) {
        valExpr = 'AUTO_MACRO_PASSWORD';
      }

      switch (cmd.command) {
        case 'open':
          code += `    driver.get(${JSON.stringify(cmd.target || suite.baseUrl || 'https://example.com')})`;
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

  return `import os
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

"""
AutoMacro Generated Selenium Python Script
Suite: ${suite.name || 'Test Suite'}
Base URL: ${suite.baseUrl || 'https://example.com'}
Generated: ${new Date().toISOString()}
"""

def run_test():
    driver = webdriver.Chrome()
    driver.set_window_size(1280, 800)
    wait = WebDriverWait(driver, 10)

    try:
${envHeader}${stepLines}
        print("✅ AutoMacro execution completed successfully!")
    finally:
        time.sleep(2)
        driver.quit()

if __name__ == '__main__':
    run_test()
`;
}
