import assert from 'assert';
import { createServer } from 'vite';

export async function runExporterEdgeCaseTests() {
  console.log('\n--- Unit Test Suite: Multi-Framework Exporters Edge Cases ---');

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

  let passed = 0;
  function it(desc, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${desc}`);
      throw err;
    }
  }

  const complexEdgeCaseSuite = {
    id: 'suite_edge_cases',
    name: "Special's & Quotes \"Test\" Suite",
    baseUrl: 'https://edge-cases.dev/app?q=1&ref=test#section',
    createdAt: 1700000000,
    updatedAt: 1700000100,
    commands: [
      { id: '1', command: 'open', target: 'https://edge-cases.dev/app?q=1&ref=test#section', status: 'passed' },
      { id: '2', command: 'click', target: 'css=[aria-label="Sign In To Account"]', status: 'passed' },
      { id: '3', command: 'type', target: 'id=user-input', value: 'Jane O\'Connor "Admin"', status: 'passed' },
      {
        id: '4',
        command: 'type',
        target: 'id=password',
        value: '{{SECRET_PASSWORD}}',
        isSensitive: true,
        envVarName: 'SECRET_PASSWORD',
        status: 'passed'
      },
      { id: '5', command: 'select', target: 'id=role-select', value: 'label=Engineering Lead', status: 'passed' },
      { id: '6', command: 'select', target: 'id=tier-select', value: 'value=enterprise_tier', status: 'passed' },
      { id: '7', command: 'submit', target: 'css=form#login-form', status: 'passed' },
      { id: '8', command: 'waitFor', target: 'xpath=//div[normalize-space()="Welcome Back"]', status: 'passed' },
      { id: '9', command: 'wait', target: '2500', status: 'passed' },
    ]
  };

  // Test 1: Playwright Escaping & Password Masking
  it('Playwright: Escapes quotes properly and handles all command types', () => {
    const code = exportToPlaywright(complexEdgeCaseSuite);

    assert(code.includes('AUTO_MACRO_PASSWORD = process.env.AUTO_MACRO_PASSWORD || \'\';'), 'Env var declared');
    assert(code.includes('await page.locator("[aria-label=\\"Sign In To Account\\"]").click();'), 'Quotes escaped in aria selector');
    assert(code.includes('await page.locator("#user-input").fill("Jane O\'Connor \\"Admin\\"");'), 'Quotes escaped in value string');
    assert(code.includes('await page.locator("#password").fill(AUTO_MACRO_PASSWORD);'), 'Sensitive value mapped to env var');
    assert(code.includes('await page.locator("#role-select").selectOption("Engineering Lead");'), 'Select label extracted');
    assert(code.includes('await page.locator("#tier-select").selectOption("value=enterprise_tier");'), 'Select value passed');
    assert(code.includes('await page.locator("form#login-form").press(\'Enter\');'), 'Submit press enter');
    assert(code.includes('await page.locator("//div[normalize-space()=\\"Welcome Back\\"]").waitFor({ state: \'visible\' });'), 'XPath wait for visible');
    assert(code.includes('await page.waitForTimeout(2500);'), 'Wait timeout with parsed integer');
  });

  // Test 2: Puppeteer Escaping
  it('Puppeteer: Renders async IIFE with clean page actions', () => {
    const code = exportToPuppeteer(complexEdgeCaseSuite);

    assert(code.includes('const AUTO_MACRO_PASSWORD = process.env.AUTO_MACRO_PASSWORD || \'\';'), 'Puppeteer env var declared');
    assert(code.includes('await page.type("#password", AUTO_MACRO_PASSWORD);'), 'Puppeteer type uses env var');
    assert(code.includes('await page.select("#role-select", "Engineering Lead");'), 'Puppeteer select label option');
    assert(code.includes('await new Promise((r) => setTimeout(r, 2500));'), 'Puppeteer fixed wait timeout');
  });

  // Test 3: Python Selenium Escaping & Locator Strategies
  it('Python Selenium: Maps locator strategies to By.ID, By.CSS_SELECTOR, and By.XPATH', () => {
    const code = exportToSelenium(complexEdgeCaseSuite);

    assert(code.includes('AUTO_MACRO_PASSWORD = os.getenv(\'AUTO_MACRO_PASSWORD\', \'\')'), 'Python os.getenv secret declared');
    assert(code.includes('(By.CSS_SELECTOR, "[aria-label=\\"Sign In To Account\\"]")'), 'CSS locator mapping');
    assert(code.includes('(By.ID, "user-input")'), 'ID locator mapping');
    assert(code.includes('(By.XPATH, "//div[normalize-space()=\\"Welcome Back\\"]")'), 'XPath locator mapping');
    assert(code.includes('time.sleep(2.5)'), 'Wait converts 2500ms to 2.5 seconds for time.sleep');
  });

  // Test 4: Selenium IDE (.side) JSON
  it('Selenium IDE (.side): Generates valid interchangeable JSON with command array', () => {
    const sideContent = exportToSeleniumSide(complexEdgeCaseSuite);
    const parsed = JSON.parse(sideContent);

    assert.strictEqual(parsed.tests.length, 1);
    assert.strictEqual(parsed.tests[0].commands.length, 9);
    assert.strictEqual(parsed.tests[0].commands[4].command, 'select');
    assert.strictEqual(parsed.tests[0].commands[4].value, 'label=Engineering Lead');
    assert.strictEqual(parsed.tests[0].commands[8].command, 'wait');
    assert.strictEqual(parsed.tests[0].commands[8].target, '2500');
  });

  // Test 5: FlowMacro Native JSON Suite
  it('FlowMacro JSON: Serializes complete test suite without losing sensitive metadata flags', () => {
    const jsonContent = exportToJson(complexEdgeCaseSuite);
    const parsed = JSON.parse(jsonContent);

    assert.strictEqual(parsed.commands[3].isSensitive, true);
    assert.strictEqual(parsed.commands[3].envVarName, 'SECRET_PASSWORD');
    assert.strictEqual(parsed.commands[3].value, '{{SECRET_PASSWORD}}');
  });

  await server.close();
  console.log(`  🌟 Passed ${passed} code exporter unit tests.\n`);
  return passed;
}
