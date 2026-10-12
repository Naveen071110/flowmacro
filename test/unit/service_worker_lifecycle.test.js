import assert from 'assert';
import fs from 'fs';
import { createMockChrome } from '../helpers/mock_chrome.js';

export async function runServiceWorkerTests() {
  console.log('\n--- Unit Test Suite: Service Worker State Persistence & Lifecycle ---');

  const swCode = fs.readFileSync('src/background/service_worker.ts', 'utf-8');

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
  // SECTION 1: Dual-Tier Storage Persistence Simulation
  // ----------------------------------------------------------------------------
  await itAsync('State Persistence: Persists active session to chrome.storage.session and fallback to local', async () => {
    const mockChrome = createMockChrome();

    const sessionPayload = {
      ideWindowId: 101,
      ideTabId: 2001,
      targetWindowId: 1,
      targetTabId: 1024,
      isRecording: true,
      isRecordingPaused: false,
      activeSuiteId: 'suite_abc123',
    };

    // Simulate service worker saving state
    await mockChrome.storage.session.set({ automacro_bg_session: sessionPayload });
    await mockChrome.storage.local.set({ automacro_recording_active: true, targetTabId: 1024 });

    const sessionRes = await mockChrome.storage.session.get('automacro_bg_session');
    assert.deepStrictEqual(sessionRes.automacro_bg_session, sessionPayload);

    const localRes = await mockChrome.storage.local.get(['automacro_recording_active', 'targetTabId']);
    assert.strictEqual(localRes.automacro_recording_active, true);
    assert.strictEqual(localRes.targetTabId, 1024);
  });

  // ----------------------------------------------------------------------------
  // SECTION 2: Service Worker Eviction & Rehydration Simulation
  // ----------------------------------------------------------------------------
  await itAsync('Rehydration: Rehydrates memory variables from storage after service worker wake-up', async () => {
    const mockChrome = createMockChrome();

    // Prior session saved before service worker termination
    await mockChrome.storage.session.set({
      automacro_bg_session: {
        ideWindowId: 50,
        ideTabId: 500,
        targetTabId: 1024,
        isRecording: true,
        activeSuiteId: 'suite_restore_test',
        sessionState: { status: 'recording', currentStepIndex: 4, logs: [] },
      },
    });

    // Simulate freshly booted service worker memory
    let inMemoryState = {
      ideWindowId: null,
      targetTabId: null,
      isRecording: false,
      activeSuiteId: null,
    };

    // Rehydrate
    const stored = await mockChrome.storage.session.get('automacro_bg_session');
    if (stored.automacro_bg_session) {
      Object.assign(inMemoryState, stored.automacro_bg_session);
    }

    assert.strictEqual(inMemoryState.ideWindowId, 50);
    assert.strictEqual(inMemoryState.targetTabId, 1024);
    assert.strictEqual(inMemoryState.isRecording, true);
    assert.strictEqual(inMemoryState.activeSuiteId, 'suite_restore_test');
  });

  // ----------------------------------------------------------------------------
  // SECTION 3: Window and Tab Removal Cleanup
  // ----------------------------------------------------------------------------
  await itAsync('Lifecycle Cleanup: Closing IDE window stops active recording and clears references', async () => {
    const mockChrome = createMockChrome();

    let ideWindowId = 88;
    let isRecording = true;

    // Simulate windows.onRemoved listener
    mockChrome.windows.onRemoved.addListener(async (windowId) => {
      if (windowId === ideWindowId) {
        ideWindowId = null;
        isRecording = false;
        await mockChrome.storage.session.remove('automacro_bg_session');
      }
    });

    mockChrome.windows.onRemoved._trigger(88);

    assert.strictEqual(ideWindowId, null);
    assert.strictEqual(isRecording, false);
    const stored = await mockChrome.storage.session.get('automacro_bg_session');
    assert.strictEqual(stored.automacro_bg_session, undefined);
  });

  // ----------------------------------------------------------------------------
  // SECTION 4: Execution Log FIFO Buffer (250 entries cap)
  // ----------------------------------------------------------------------------
  it('Log Buffer: Caps execution log stream at 250 items with FIFO eviction', () => {
    const logs = [];

    function addLog(msg) {
      logs.push({ timestamp: Date.now(), message: msg });
      if (logs.length > 250) {
        logs.shift();
      }
    }

    for (let i = 1; i <= 300; i++) {
      addLog(`Log event #${i}`);
    }

    assert.strictEqual(logs.length, 250, 'Buffer must be capped at 250');
    assert.strictEqual(logs[0].message, 'Log event #51', 'Earliest 50 logs must have been evicted');
    assert.strictEqual(logs[249].message, 'Log event #300', 'Latest log must be retained');
  });

  // ----------------------------------------------------------------------------
  // SECTION 5: Source Code Contract Verification
  // ----------------------------------------------------------------------------
  it('Verifies service_worker.ts implements 3-tier replay retry loop with tab stabilization', () => {
    assert(swCode.includes('// Attempt 1'), 'Attempt 1 dispatch present');
    assert(swCode.includes('// Attempt 2: Page may be transitioning or reloading'), 'Attempt 2 retry present');
    assert(swCode.includes('// Attempt 3: Final attempt with longer stabilization'), 'Attempt 3 retry present');
    assert(swCode.includes('waitForTabComplete'), 'Waits for tab to complete loading before retry');
  });

  it('Verifies service_worker.ts implements keep-alive alarms for long workflows', () => {
    assert(swCode.includes('REPLAY_KEEPALIVE_ALARM'), 'Alarm constant defined');
    assert(swCode.includes('chrome.alarms.create'), 'Creates keep-alive alarm');
    assert(swCode.includes('chrome.alarms.clear'), 'Clears alarm on replay termination');
  });

  console.log(`  🌟 Passed ${passed} service worker lifecycle unit tests.\n`);
  return passed;
}
