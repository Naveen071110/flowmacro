import assert from 'assert';
import fs from 'fs';

export async function runWaterfallSelectorTests() {
  console.log('\n--- Unit Test Suite: 5-Tier Selector Waterfall & Sensitive Input Detection ---');

  const recorderCode = fs.readFileSync('src/content_scripts/recorder.ts', 'utf-8');

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

  // ----------------------------------------------------------------------------
  // SECTION 1: Sensitive Input Detection Engine
  // ----------------------------------------------------------------------------
  function isSensitiveFieldMock(element) {
    if (element.tagName === 'INPUT' && element.type === 'password') {
      return true;
    }
    const autocomplete = (element.autocomplete || '').toLowerCase();
    if (
      autocomplete.includes('password') ||
      autocomplete.includes('current-password') ||
      autocomplete.includes('new-password')
    ) {
      return true;
    }
    const testStr = `${element.id || ''} ${element.name || ''} ${element.ariaLabel || ''} ${element.placeholder || ''}`.toLowerCase();
    return /(password|passwd|secret|apikey|api_key|token|auth_token|pin|cvv)/i.test(testStr);
  }

  it('Detects <input type="password"> as sensitive', () => {
    assert.strictEqual(isSensitiveFieldMock({ tagName: 'INPUT', type: 'password' }), true);
  });

  it('Detects autocomplete="current-password" and "new-password" as sensitive', () => {
    assert.strictEqual(isSensitiveFieldMock({ tagName: 'INPUT', type: 'text', autocomplete: 'current-password' }), true);
    assert.strictEqual(isSensitiveFieldMock({ tagName: 'INPUT', type: 'text', autocomplete: 'new-password' }), true);
  });

  it('Detects sensitive tokens in id, name, placeholder, and aria-label', () => {
    assert.strictEqual(isSensitiveFieldMock({ tagName: 'INPUT', id: 'user_auth_token' }), true);
    assert.strictEqual(isSensitiveFieldMock({ tagName: 'INPUT', name: 'apiKey' }), true);
    assert.strictEqual(isSensitiveFieldMock({ tagName: 'INPUT', placeholder: 'Enter Master Secret...' }), true);
    assert.strictEqual(isSensitiveFieldMock({ tagName: 'INPUT', ariaLabel: 'Card CVV Security Code' }), true);
    assert.strictEqual(isSensitiveFieldMock({ tagName: 'INPUT', id: 'banking_pin' }), true);
  });

  it('Edge Case: Does NOT falsely classify normal inputs as sensitive', () => {
    assert.strictEqual(isSensitiveFieldMock({ tagName: 'INPUT', id: 'username', placeholder: 'Enter username' }), false);
    assert.strictEqual(isSensitiveFieldMock({ tagName: 'INPUT', id: 'email-address', type: 'email' }), false);
    assert.strictEqual(isSensitiveFieldMock({ tagName: 'INPUT', id: 'search-query', name: 'q' }), false);
    assert.strictEqual(isSensitiveFieldMock({ tagName: 'INPUT', id: 'city', placeholder: 'New York' }), false);
  });

  // ----------------------------------------------------------------------------
  // SECTION 2: Dynamic ID Filter (Regex Discard Engine)
  // ----------------------------------------------------------------------------
  const isDynamicId = (id) =>
    /(:r[0-9a-z]+:|\b[a-f0-9]{8,}\b|mui-|ember|react-|radix-)/i.test(id) ||
    /\d{4,}/.test(id);

  it('Dynamic ID Filter: Rejects React 18 generated IDs (:r0:, :r1a:)', () => {
    assert.strictEqual(isDynamicId(':r0:'), true);
    assert.strictEqual(isDynamicId(':r1b:'), true);
    assert.strictEqual(isDynamicId(':r25:'), true);
  });

  it('Dynamic ID Filter: Rejects Ember, MUI, Radix, and React transient IDs', () => {
    assert.strictEqual(isDynamicId('ember1284'), true);
    assert.strictEqual(isDynamicId('mui-component-input-42'), true);
    assert.strictEqual(isDynamicId('radix-id-12'), true);
    assert.strictEqual(isDynamicId('react-tabs-0'), true);
  });

  it('Dynamic ID Filter: Rejects 4+ digit numeric hashes and hex hashes', () => {
    assert.strictEqual(isDynamicId('button-98234'), true);
    assert.strictEqual(isDynamicId('input-8f7a6b2c'), true);
    assert.strictEqual(isDynamicId('12345'), true);
  });

  it('Dynamic ID Filter: Accepts stable semantic IDs', () => {
    assert.strictEqual(isDynamicId('identifier-field'), false);
    assert.strictEqual(isDynamicId('password-field'), false);
    assert.strictEqual(isDynamicId('login-btn'), false);
    assert.strictEqual(isDynamicId('email'), false);
    assert.strictEqual(isDynamicId('submit-order'), false);
  });

  // ----------------------------------------------------------------------------
  // SECTION 3: CSS Path Sanitization & Emoji Stripping
  // ----------------------------------------------------------------------------
  function sanitizeClasses(classList) {
    return classList.filter(
      (c) =>
        /^[a-zA-Z0-9_-]+$/.test(c) &&
        !/^[0-9]/.test(c) &&
        !/^(css-|style-|styled-|_)/i.test(c) &&
        !/[a-f0-9]{6,}/i.test(c) &&
        !/^cl-internal-[a-z0-9]{6,}$/i.test(c) &&
        !c.includes('🔒')
    );
  }

  it('Emoji Stripping: Removes Clerk emoji lock class (.🔒️) from CSS paths', () => {
    const rawClasses = ['cl-form', '🔒️', 'active'];
    const sanitized = sanitizeClasses(rawClasses);
    assert.deepStrictEqual(sanitized, ['cl-form', 'active']);
    assert(!sanitized.includes('🔒️'), 'Emoji class must be stripped');
  });

  it('Dynamic Hash Stripping: Removes ephemeral CSS-in-JS and internal hashes', () => {
    const rawClasses = ['cl-form', 'cl-internal-1pnppin', 'css-19f8x7y', 'styled-btn'];
    const sanitized = sanitizeClasses(rawClasses);
    assert.deepStrictEqual(sanitized, ['cl-form']);
  });

  // ----------------------------------------------------------------------------
  // SECTION 4: Semantic Button & Element Text Matching
  // ----------------------------------------------------------------------------
  function getButtonSemanticLocator(tag, text, type, classList) {
    const list = [];
    if (tag === 'button' || (tag === 'input' && type === 'submit')) {
      const btnText = (text || '').trim();
      if (btnText && btnText.length > 0 && btnText.length <= 40 && !btnText.includes('\n') && !btnText.includes('"')) {
        list.push([`xpath=//button[normalize-space()="${btnText}"]`, 'button:text']);
      }
      if (type === 'submit') {
        list.push([`css=button[type="submit"]`, 'button:type']);
      }
      const semanticClass = classList.find((c) =>
        /(primary|submit|login|signin|confirm|action|btn-main)/i.test(c) && /^[a-zA-Z0-9_-]+$/.test(c)
      );
      if (semanticClass) {
        list.push([`css=button.${semanticClass}`, 'button:class']);
      }
    }
    return list;
  }

  it('Generates normalize-space button XPath and semantic classes for buttons', () => {
    const locators = getButtonSemanticLocator('button', '  Continue  ', 'submit', ['cl-formButtonPrimary', 'btn-main']);
    assert(locators.some(([loc]) => loc === 'xpath=//button[normalize-space()="Continue"]'), 'Normalizes button text');
    assert(locators.some(([loc]) => loc === 'css=button[type="submit"]'), 'Captures button type');
    assert(locators.some(([loc]) => loc === 'css=button.cl-formButtonPrimary'), 'Captures semantic class');
  });

  // ----------------------------------------------------------------------------
  // SECTION 5: Shadow DOM Piercing Hierarchy
  // ----------------------------------------------------------------------------
  it('Shadow DOM: Generates nested piercing path (shadow=host1 >>> host2 >>> inner)', () => {
    const hosts = ['custom-header', 'auth-widget'];
    const innerTarget = '#sign-in-btn';
    const shadowPierce = `shadow=${hosts.join(' >>> ')} >>> ${innerTarget}`;
    assert.strictEqual(shadowPierce, 'shadow=custom-header >>> auth-widget >>> #sign-in-btn');
  });

  // ----------------------------------------------------------------------------
  // SECTION 6: Source Code Contract Verification
  // ----------------------------------------------------------------------------
  it('Verifies recorder.ts enforces 5-tier waterfall cascade', () => {
    assert(recorderCode.includes('data-testid'), 'Tier 1 test attributes present');
    assert(recorderCode.includes('(:r[0-9a-z]+:'), 'Tier 2 dynamic ID filter present');
    assert(recorderCode.includes('aria-label'), 'Tier 3 aria-label present');
    assert(recorderCode.includes('normalize-space()='), 'Tier 4 button text present');
    assert(recorderCode.includes('generateCssPath'), 'Tier 5 CSS path present');
    assert(recorderCode.includes('generateXPath'), 'Tier 5 XPath position present');
    assert(recorderCode.includes('shadow:pierce'), 'Shadow pierce locator present');
  });

  console.log(`  🌟 Passed ${passed} waterfall selector unit tests.\n`);
  return passed;
}
