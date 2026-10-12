import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEST_PAGE_URL = pathToFileURL(path.resolve(__dirname, '../test_page.html')).href;

test.describe('FlowMacro E2E & Browser Automation Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TEST_PAGE_URL);
    await page.waitForLoadState('domcontentloaded');
  });

  // ----------------------------------------------------------------------------
  // E2E Test 1: Standard Authentication Flow
  // ----------------------------------------------------------------------------
  test('E2E: Standard login form submits credentials and updates DOM success banner', async ({ page }) => {
    // Fill credentials
    await page.locator('#username').fill('lead.engineer@acme.dev');
    await page.locator('#password').fill('SuperSecretP@ss2026!');

    // Click submit
    await page.locator('#login-submit').click();

    // Verify success banner appears with correct identifier
    const successBanner = page.locator('#login-success');
    await expect(successBanner).toBeVisible();

    const bannerText = page.locator('#login-success-text');
    await expect(bannerText).toContainText('AUTH_SUCCESSFUL: lead.engineer@acme.dev');

    // Verify console log entry was rendered
    const consoleLog = page.locator('#console-log');
    await expect(consoleLog).toContainText('Standard Login Form submitted valid credentials');
  });

  // ----------------------------------------------------------------------------
  // E2E Test 2: Complex Multi-Input Form Submission (Select, PIN, Role)
  // ----------------------------------------------------------------------------
  test('E2E: Complex auth form handles dropdown selects, numeric PINs, and submission', async ({ page }) => {
    await page.locator('#complex-email').fill('security.lead@enterprise.io');
    await page.locator('#complex-password').fill('VaultToken#987');
    await page.locator('#complex-pin').fill('8492');

    // Select dropdown option
    await page.locator('#complex-role').selectOption('admin');

    await page.locator('#complex-submit').click();

    const bannerText = page.locator('#login-success-text');
    await expect(bannerText).toContainText('AUTH_SUCCESSFUL: security.lead@enterprise.io');

    const consoleLog = page.locator('#console-log');
    await expect(consoleLog).toContainText('Complex Auth Form (admin)');
  });

  // ----------------------------------------------------------------------------
  // E2E Test 3: Shadow DOM Piercing Interaction
  // ----------------------------------------------------------------------------
  test('E2E: Shadow DOM piercing penetrates custom Web Component root and executes action', async ({ page }) => {
    // Locate element inside open shadow root of <shadow-auth-box>
    const shadowHost = page.locator('shadow-auth-box');
    await expect(shadowHost).toBeVisible();

    // Fill token inside shadow DOM
    const shadowInput = shadowHost.locator('#shadow-token-input');
    await shadowInput.fill('SECURE_SHADOW_KEY_ALPHA');

    // Click button inside shadow DOM
    const shadowBtn = shadowHost.locator('#shadow-submit-btn');
    await shadowBtn.click();

    // Verify status inside shadow DOM becomes visible
    const shadowStatus = shadowHost.locator('#shadow-status');
    await expect(shadowStatus).toBeVisible();
    await expect(shadowStatus).toContainText('SHADOW_ACTION_VERIFIED: SECURE_SHADOW_KEY_ALPHA');

    // Verify parent event console logged the event
    const consoleLog = page.locator('#console-log');
    await expect(consoleLog).toContainText('SHADOW_DOM: Action executed inside shadowRoot');
  });

  // ----------------------------------------------------------------------------
  // E2E Test 4: SPA PushState Route Interception
  // ----------------------------------------------------------------------------
  test('E2E: SPA route change flushes pending input and updates browser location', async ({ page }) => {
    const spaInput = page.locator('#spa-quick-input');
    await spaInput.fill('pending_spa_keystrokes');

    // Trigger pushState
    await page.locator('#spa-pushstate-btn').click();

    // Verify URL was modified via history.pushState
    expect(page.url()).toContain('spa_route=');

    // Verify console log logged input value flush
    const consoleLog = page.locator('#console-log');
    await expect(consoleLog).toContainText('SPA_PUSHSTATE: Navigated to');
    await expect(consoleLog).toContainText('pending_spa_keystrokes');
  });

  // ----------------------------------------------------------------------------
  // E2E Test 5: Embedded Iframe Context Routing
  // ----------------------------------------------------------------------------
  test('E2E: Embedded iframe routes inputs and actions across frame boundaries', async ({ page }) => {
    // Frame locator
    const frame = page.frameLocator('#embedded-auth-frame');
    const frameInput = frame.locator('#iframe-card-token');
    await frameInput.fill('CARD_TOKEN_5544');

    const frameBtn = frame.locator('#iframe-auth-btn');
    await frameBtn.click();

    // Parent window listens to postMessage from iframe
    const consoleLog = page.locator('#console-log');
    await expect(consoleLog).toContainText('IFRAME: Button clicked inside sub-frame context.');
  });

  // ----------------------------------------------------------------------------
  // E2E Test 6: Form Reset & State Cleanliness
  // ----------------------------------------------------------------------------
  test('E2E: Reset button clears input states and removes success banner', async ({ page }) => {
    await page.locator('#username').fill('temp.user@acme.dev');
    await page.locator('#password').fill('pass123');
    await page.locator('#login-submit').click();

    await expect(page.locator('#login-success')).toBeVisible();

    // Click reset inside banner
    await page.locator('#login-success button').click();

    // Verify banner is hidden
    await expect(page.locator('#login-success')).not.toBeVisible();
    expect(await page.locator('#username').inputValue()).toBe('');
  });
});
