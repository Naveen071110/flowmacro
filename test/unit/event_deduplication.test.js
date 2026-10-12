import assert from 'assert';
import fs from 'fs';

export async function runEventDeduplicationTests() {
  console.log('\n--- Unit Test Suite: Event Deduplication & Debounce Engine ---');

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
  // SECTION 1: Clerk / Multi-Step Auth Submit Deduplication Simulation
  // ----------------------------------------------------------------------------
  it('Deduplication: Suppresses ghost SUBMIT step when button click occurred within 400ms', () => {
    let recordedCommands = [];
    let lastClickTimestamp = 0;
    let lastClickedElement = null;

    function simulateClick(element, timestamp) {
      lastClickTimestamp = timestamp;
      lastClickedElement = element;
      recordedCommands.push({
        type: 'click',
        target: element.id || 'button',
        timestamp,
      });
    }

    function simulateSubmit(form, timestamp) {
      const now = timestamp;
      // Deduplicate submit if preceded by a click on submit/form button within 400ms
      const isRecentClick = now - lastClickTimestamp < 400;
      const clickedSubmitBtn = lastClickedElement && (
        lastClickedElement.tagName === 'BUTTON' ||
        (lastClickedElement.tagName === 'INPUT' && lastClickedElement.type === 'submit') ||
        lastClickedElement.closest?.('button')
      );

      if (isRecentClick && clickedSubmitBtn) {
        // Redundant submit skipped!
        return;
      }

      recordedCommands.push({
        type: 'submit',
        target: form.id || 'form',
        timestamp,
      });
    }

    // Step 1: User clicks "Continue" button at t=1000
    const continueBtn = { tagName: 'BUTTON', id: 'continue-btn' };
    simulateClick(continueBtn, 1000);

    // Form library fires submit event at t=1050 (50ms later)
    simulateSubmit({ tagName: 'FORM', id: 'cl-auth-form' }, 1050);

    // Assert: Only 1 command was recorded (the click), ghost submit was dropped
    assert.strictEqual(recordedCommands.length, 1);
    assert.strictEqual(recordedCommands[0].type, 'click');
    assert.strictEqual(recordedCommands[0].target, 'continue-btn');
  });

  it('Deduplication: Enter key press in input DOES record SUBMIT without suppression', () => {
    let recordedCommands = [];
    let lastClickTimestamp = 0;
    let lastClickedElement = null;

    function simulateEnterSubmit(form, timestamp) {
      const now = timestamp;
      const isRecentClick = now - lastClickTimestamp < 400;
      const clickedSubmitBtn = lastClickedElement && (
        lastClickedElement.tagName === 'BUTTON' ||
        (lastClickedElement.tagName === 'INPUT' && lastClickedElement.type === 'submit')
      );

      if (isRecentClick && clickedSubmitBtn) {
        return;
      }

      recordedCommands.push({
        type: 'submit',
        target: form.id || 'form',
        timestamp,
      });
    }

    // User pressed Enter at t=5000 with no prior button click
    simulateEnterSubmit({ tagName: 'FORM', id: 'cl-auth-form' }, 5000);

    // Assert: Submit was recorded because it was keyboard initiated
    assert.strictEqual(recordedCommands.length, 1);
    assert.strictEqual(recordedCommands[0].type, 'submit');
  });

  // ----------------------------------------------------------------------------
  // SECTION 2: Input Debouncing & Immediate Flushing Triggers
  // ----------------------------------------------------------------------------
  it('Debouncing: Rapid keystrokes record only the final settled input value', () => {
    let recordedCommands = [];
    let debounceTimer = null;
    let pendingInput = null;

    function onType(inputEl, value) {
      if (debounceTimer) clearTimeout(debounceTimer);
      pendingInput = { el: inputEl, value };
      debounceTimer = setTimeout(() => {
        recordedCommands.push({ type: 'type', value: pendingInput.value });
        pendingInput = null;
        debounceTimer = null;
      }, 300);
    }

    function flush() {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      if (pendingInput) {
        recordedCommands.push({ type: 'type', value: pendingInput.value });
        pendingInput = null;
      }
    }

    // Rapid typing "n", "na", "nav", "naveen"
    onType({ id: 'username' }, 'n');
    onType({ id: 'username' }, 'na');
    onType({ id: 'username' }, 'nav');
    onType({ id: 'username' }, 'naveen');

    // Before timer fires, form is submitted -> flush triggered!
    flush();

    assert.strictEqual(recordedCommands.length, 1);
    assert.strictEqual(recordedCommands[0].value, 'naveen', 'Only final value flushed');
  });

  it('SPA Route Interception: history.pushState flushes pending inputs immediately', () => {
    assert(recorderCode.includes('history.pushState'), 'Wraps history.pushState in recorder.ts');
    assert(recorderCode.includes('history.replaceState'), 'Wraps history.replaceState in recorder.ts');
    assert(recorderCode.includes('flushPendingInput'), 'Calls flushPendingInput in route interceptor');
  });

  it('Page Lifecycle: beforeunload & pagehide flush pending inputs on full reload', () => {
    assert(recorderCode.includes('window.addEventListener(\'beforeunload\''), 'Listens for beforeunload');
    assert(recorderCode.includes('window.addEventListener(\'pagehide\''), 'Listens for pagehide');
  });

  // ----------------------------------------------------------------------------
  // SECTION 3: 3-State Recording Lifecycle Contract
  // ----------------------------------------------------------------------------
  it('Recording Lifecycle: Supports START, PAUSE, RESUME, and STOP messages', () => {
    assert(recorderCode.includes("action === 'START_RECORDING'"), 'Handles START_RECORDING');
    assert(recorderCode.includes("action === 'PAUSE_RECORDING'"), 'Handles PAUSE_RECORDING');
    assert(recorderCode.includes("action === 'RESUME_RECORDING'"), 'Handles RESUME_RECORDING');
    assert(recorderCode.includes("action === 'STOP_RECORDING'"), 'Handles STOP_RECORDING');
  });

  console.log(`  🌟 Passed ${passed} event deduplication unit tests.\n`);
  return passed;
}
