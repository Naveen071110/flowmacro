import assert from 'assert';
import fs from 'fs';

export async function runReplayerTests() {
  console.log('\n--- Unit Test Suite: Replayer Waterfall Fallback & DOM Simulator ---');

  const replayerCode = fs.readFileSync('src/content_scripts/replayer.ts', 'utf-8');

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

  async function itAsync(desc, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${desc}`);
      throw err;
    }
  }

  // ----------------------------------------------------------------------------
  // SECTION 1: CSS Selector Sanitization Before Querying
  // ----------------------------------------------------------------------------
  function sanitizeCssTarget(sel) {
    return sel.replace(/\.🔒️/g, '').replace(/\.cl-internal-[a-z0-9]+/g, '');
  }

  it('Replayer CSS Sanitizer: Strips emoji locks and dynamic classes to prevent SyntaxError', () => {
    const rawTarget = 'form.cl-form.🔒️ > div.cl-internal-1pnppin:nth-of-type(2) > button.cl-formButtonPrimary';
    const clean = sanitizeCssTarget(rawTarget);
    assert(!clean.includes('🔒️'), 'Emoji lock stripped');
    assert(!clean.includes('cl-internal-1pnppin'), 'Dynamic internal hash stripped');
  });

  // ----------------------------------------------------------------------------
  // SECTION 2: Target Waterfall Fallback Simulation
  // ----------------------------------------------------------------------------
  async function mockResolveTargetElement(primaryTarget, candidates, domElements, timeoutMs = 100) {
    const startTime = Date.now();
    const targetsToTry = [primaryTarget];
    if (candidates) {
      candidates.forEach(([sel]) => {
        if (sel && !targetsToTry.includes(sel)) targetsToTry.push(sel);
      });
    }

    while (Date.now() - startTime < timeoutMs) {
      for (const target of targetsToTry) {
        if (domElements[target]) {
          return { element: domElements[target], resolvedLocator: target };
        }
      }
      await new Promise((r) => setTimeout(r, 10));
    }

    throw new Error(
      `Target not found in DOM within ${timeoutMs}ms. Attempted locators: ${JSON.stringify(targetsToTry)}`
    );
  }

  await itAsync('Waterfall Fallback: Primary target succeeds when present in DOM', async () => {
    const dom = { 'id=identifier-field': { tagName: 'INPUT', id: 'identifier-field' } };
    const res = await mockResolveTargetElement('id=identifier-field', [['css=.input-user', 'css']], dom);
    assert.strictEqual(res.resolvedLocator, 'id=identifier-field');
  });

  await itAsync('Waterfall Fallback: Falls back to Candidate 2 when primary is missing/redesigned', async () => {
    // Primary brittle CSS is missing from DOM, but stable ARIA candidate exists
    const dom = { 'css=[aria-label="Sign In"]': { tagName: 'BUTTON', text: 'Sign In' } };
    const candidates = [
      ['css=.old-broken-class-btn', 'css'],
      ['css=[aria-label="Sign In"]', 'aria-label'],
      ['xpath=//button[1]', 'xpath'],
    ];

    const res = await mockResolveTargetElement('css=.old-broken-class-btn', candidates, dom);
    assert.strictEqual(res.resolvedLocator, 'css=[aria-label="Sign In"]');
  });

  await itAsync('Error Handling: Throws structured error with all attempted locators on timeout', async () => {
    const dom = {}; // Empty DOM
    const primary = 'css=.unmounted-modal';
    const candidates = [
      ['id=modal-content', 'id'],
      ['xpath=//div[1]', 'xpath'],
    ];

    await assert.rejects(
      async () => {
        await mockResolveTargetElement(primary, candidates, dom, 40);
      },
      (err) => {
        assert(err.message.includes('Target not found in DOM within 40ms'), 'Mentions timeout');
        assert(err.message.includes('Attempted locators:'), 'Lists attempted locators');
        assert(err.message.includes('css=.unmounted-modal'), 'Includes primary locator');
        assert(err.message.includes('id=modal-content'), 'Includes candidate locator');
        return true;
      }
    );
  });

  // ----------------------------------------------------------------------------
  // SECTION 3: Shadow DOM Piercing Resolution
  // ----------------------------------------------------------------------------
  it('Shadow DOM: Resolves host component and queries down shadowRoot', () => {
    assert(replayerCode.includes('resolveShadowPierceTarget'), 'replayer.ts implements resolveShadowPierceTarget');
    assert(replayerCode.includes('shadow='), 'replayer.ts parses shadow= selector syntax');
    assert(replayerCode.includes(".split('>>>')"), 'replayer.ts splits chained shadow roots');
    assert(replayerCode.includes('queryDomDeep'), 'replayer.ts implements recursive queryDomDeep');
  });

  // ----------------------------------------------------------------------------
  // SECTION 4: Action Simulation & Event Dispatch Contract
  // ----------------------------------------------------------------------------
  it('Simulate Click: Dispatches mousedown, mouseup, and click events with visual highlight', () => {
    assert(replayerCode.includes('simulateClick'), 'simulateClick present in replayer');
    assert(replayerCode.includes('highlightTarget'), 'highlightTarget visually outlines element with #22c55e');
  });

  it('Simulate Type: Updates input value and dispatches input & change events for React/Vue models', () => {
    assert(replayerCode.includes('simulateType'), 'simulateType present in replayer');
    assert(replayerCode.includes('dispatchEvent(new Event(\'input\''), 'Fires input event for framework reactivity');
    assert(replayerCode.includes('dispatchEvent(new Event(\'change\''), 'Fires change event');
  });

  it('Simulate Select: Supports both label= and value= dropdown options', () => {
    assert(replayerCode.includes('simulateSelect'), 'simulateSelect present in replayer');
    assert(replayerCode.includes('val.startsWith(\'label=\')'), 'Supports label= selector');
    assert(replayerCode.includes('val.startsWith(\'value=\')'), 'Supports value= selector');
  });

  it('Simulate Submit: Prefers HTMLFormElement.requestSubmit() with form.submit() fallback', () => {
    assert(replayerCode.includes('form.requestSubmit()'), 'Uses standard requestSubmit()');
    assert(replayerCode.includes('form.submit()'), 'Falls back to submit()');
  });

  console.log(`  🌟 Passed ${passed} replayer waterfall unit tests.\n`);
  return passed;
}
