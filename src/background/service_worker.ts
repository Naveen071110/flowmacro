import {
  SeleniumCommand,
  TestSuite,
  ReplaySessionState,
  ExecutionLog,
} from '../types/macro';

const SESSION_STORAGE_KEY = 'automacro_bg_session';

interface SessionData {
  ideWindowId: number | null;
  ideTabId: number | null;
  targetWindowId: number | null;
  targetTabId: number | null;
  isRecording: boolean;
  isRecordingPaused?: boolean;
  activeSuiteId: string | null;
  sessionState: ReplaySessionState;
  activeSuite: TestSuite | null;
  currentReplayIndex: number;
  replaySpeed: number;
  awaitingNavigation: boolean;
  navigationStartedAt: number | null;
}

// In-memory state management (synchronized with chrome.storage.session)
let ideWindowId: number | null = null;
let ideTabId: number | null = null;
let targetWindowId: number | null = null;
let targetTabId: number | null = null;

let isRecording = false;
let isRecordingPaused = false;
let activeSuiteId: string | null = null;

let sessionState: ReplaySessionState = {
  suiteId: null,
  status: 'idle',
  currentStepIndex: 0,
  totalSteps: 0,
  speed: 1,
  logs: [],
};

let activeSuite: TestSuite | null = null;
let currentReplayIndex = 0;
let replaySpeed = 1;

let isAwaitingNavigationFlag = false;
let navigationStartedAt: number | null = null;
let awaitingNavigationPromiseResolver: (() => void) | null = null;
let replayAbortController: { aborted: boolean; paused: boolean } | null = null;

// ============================================================================
// CHROME.STORAGE.SESSION PERSISTENCE & REHYDRATION
// ============================================================================
async function updateRecordingSessionStorage(recording: boolean, paused: boolean, tabId: number | null) {
  isRecording = recording;
  isRecordingPaused = paused;
  if (tabId !== undefined) {
    targetTabId = tabId;
  }
  const payload = {
    isRecording: recording,
    isPaused: paused,
    targetTabId: targetTabId,
  };
  try {
    if (chrome.storage?.session) {
      await chrome.storage.session.set(payload);
    }
  } catch (err) {
    console.debug('[FlowMacro] session storage set notice:', err);
  }
  try {
    if (chrome.storage?.local) {
      await chrome.storage.local.set({
        automacro_recording_active: recording && !paused,
        ...payload,
      });
    }
  } catch (err) {
    console.debug('[FlowMacro] local storage set notice:', err);
  }
  await persistSession();
}

async function persistSession(): Promise<void> {
  try {
    if (chrome.storage?.session) {
      await chrome.storage.session.set({
        [SESSION_STORAGE_KEY]: {
          ideWindowId,
          ideTabId,
          targetWindowId,
          targetTabId,
          isRecording,
          isRecordingPaused,
          activeSuiteId,
          sessionState,
          activeSuite,
          currentReplayIndex,
          replaySpeed,
          awaitingNavigation: isAwaitingNavigationFlag || !!awaitingNavigationPromiseResolver,
          navigationStartedAt,
        } as SessionData,
      });
    }
  } catch (e) {
    console.warn('Session persist notice:', e);
  }
}

async function rehydrateSessionState(): Promise<void> {
  try {
    if (chrome.storage?.session) {
      const res = await chrome.storage.session.get(SESSION_STORAGE_KEY);
      const data: Partial<SessionData> | undefined = res[SESSION_STORAGE_KEY];
      if (data) {
        if (data.ideWindowId !== undefined) ideWindowId = data.ideWindowId ?? null;
        if (data.ideTabId !== undefined) ideTabId = data.ideTabId ?? null;
        if (data.targetWindowId !== undefined) targetWindowId = data.targetWindowId ?? null;
        if (data.targetTabId !== undefined) targetTabId = data.targetTabId ?? null;
        if (data.isRecording !== undefined) isRecording = data.isRecording;
        if (data.isRecordingPaused !== undefined) isRecordingPaused = data.isRecordingPaused;
        if (data.activeSuiteId !== undefined) activeSuiteId = data.activeSuiteId ?? null;
        if (data.sessionState !== undefined) sessionState = data.sessionState;
        if (data.activeSuite !== undefined) activeSuite = data.activeSuite ?? null;
        if (data.currentReplayIndex !== undefined) currentReplayIndex = data.currentReplayIndex;
        if (data.replaySpeed !== undefined) replaySpeed = data.replaySpeed;

        if (data.awaitingNavigation) {
          const elapsed = Date.now() - (data.navigationStartedAt || 0);
          if (elapsed < 8000) {
            isAwaitingNavigationFlag = true;
            navigationStartedAt = data.navigationStartedAt ?? null;
          } else {
            isAwaitingNavigationFlag = false;
            navigationStartedAt = null;
          }
        }
      }
    }
  } catch (e) {
    console.warn('Session rehydration notice:', e);
  }
}

// Rehydrate immediately at top-level on service worker wake-up
const rehydrationPromise = rehydrateSessionState();

// ============================================================================
// EXTENSION ACTION -> LAUNCH STANDALONE IDE WINDOW (960x750)
// ============================================================================
chrome.action.onClicked.addListener(async () => {
  await rehydrationPromise;

  if (ideWindowId !== null) {
    try {
      const existing = await chrome.windows.get(ideWindowId);
      if (existing) {
        await chrome.windows.update(ideWindowId, { focused: true });
        return;
      }
    } catch (winErr) {
      console.debug('[AutoMacro] Previous IDE window closed or not found:', winErr);
      ideWindowId = null;
      ideTabId = null;
      await persistSession();
    }
  }

  const win = await chrome.windows.create({
    url: 'ide.html',
    type: 'popup',
    width: 960,
    height: 750,
    focused: true,
  });

  ideWindowId = win.id || null;
  if (win.tabs && win.tabs.length > 0) {
    ideTabId = win.tabs[0].id || null;
  } else if (win.id) {
    try {
      const tabs = await chrome.tabs.query({ windowId: win.id });
      if (tabs.length > 0) {
        ideTabId = tabs[0].id || null;
      }
    } catch (tabQueryErr) {
      console.warn('[AutoMacro] Error querying tabs for IDE window:', tabQueryErr);
    }
  }
  await persistSession();
});

// Clean up references when windows are closed
chrome.windows.onRemoved.addListener(async (windowId) => {
  await rehydrationPromise;

  if (windowId === ideWindowId) {
    ideWindowId = null;
    ideTabId = null;
    await persistSession();
    await stopRecording();
    stopReplay();
  } else if (windowId === targetWindowId) {
    targetWindowId = null;
    targetTabId = null;
    await persistSession();
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  await rehydrationPromise;

  if (tabId === targetTabId) {
    targetTabId = null;
    targetWindowId = null;
    await persistSession();
  } else if (tabId === ideTabId) {
    ideTabId = null;
    ideWindowId = null;
    await persistSession();
  }
});

// ============================================================================
// PAGE LIFECYCLE & WEB NAVIGATION SYNC
// ============================================================================
if (chrome.webNavigation?.onCompleted) {
  chrome.webNavigation.onCompleted.addListener(async (details) => {
    if (details.frameId !== 0) return; // Top-level frame only
    await rehydrationPromise;

    if (details.tabId === targetTabId) {
      if (isRecording && !isRecordingPaused) {
        try {
          await ensureScriptInjected(details.tabId, 'content_scripts/recorder.js');
          chrome.tabs.sendMessage(details.tabId, { type: 'START_RECORDING' }).catch(() => {});
          addLog(`[Navigation] Recorder attached on redirect: ${details.url}`, 'info');
        } catch (e) {
          console.debug('[FlowMacro] webNavigation injection notice:', e);
        }
      }
    }
  });
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  await rehydrationPromise;

  if (tabId !== targetTabId) return;

  if (changeInfo.status === 'complete') {
    // If recording on target tab, ensure recorder script is injected
    if (isRecording && !isRecordingPaused) {
      await ensureScriptInjected(tabId, 'content_scripts/recorder.js');
      chrome.tabs.sendMessage(tabId, { type: 'START_RECORDING' }).catch((err) => {
        console.debug(`[FlowMacro] Tab ${tabId} START_RECORDING notice:`, err);
      });
      addLog(`[Navigation] Injected recorder into ${tab.url || 'target page'}`, 'info');
    }

    // If replayer is active, always re-inject replayer on page load
    if (sessionState.status === 'replaying') {
      await ensureScriptInjected(tabId, 'content_scripts/replayer.js');
      addLog(`[Navigation] Re-injected replayer into ${tab.url || 'target page'}`, 'info');
    }

    // If replayer was awaiting navigation
    if (awaitingNavigationPromiseResolver || isAwaitingNavigationFlag) {
      const resolve = awaitingNavigationPromiseResolver;
      awaitingNavigationPromiseResolver = null;
      isAwaitingNavigationFlag = false;
      navigationStartedAt = null;
      await persistSession();

      if (resolve) {
        resolve();
      } else if (sessionState.status === 'replaying' && activeSuite) {
        // Service worker was evicted while waiting for navigation; resume replay!
        startReplayProcess(activeSuite, replaySpeed, currentReplayIndex + 1);
      }
    }
  }
});

// ============================================================================
// MESSAGE ROUTER
// ============================================================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Capture IDE tab ID from any incoming message from the IDE
  if (sender.tab?.id && (sender.tab.url?.includes('ide.html') || sender.url?.includes('ide.html'))) {
    ideTabId = sender.tab.id;
    if (sender.tab.windowId) ideWindowId = sender.tab.windowId;
    persistSession();
  }

  handleIncomingMessage(message, sender)
    .then((res) => sendResponse(res))
    .catch((err) => sendResponse({ error: err.message || String(err) }));
  return true;
});

async function handleIncomingMessage(msg: any, _sender: chrome.runtime.MessageSender) {
  await rehydrationPromise;
  const actionType = msg.type || msg.action;

  switch (actionType) {
    case 'START_RECORDING': {
      return await startRecordingFlow(msg.baseUrl, msg.suiteId);
    }

    case 'PAUSE_RECORDING': {
      return await pauseRecordingFlow();
    }

    case 'RESUME_RECORDING': {
      return await resumeRecordingFlow();
    }

    case 'STOP_RECORDING': {
      return await stopRecording();
    }

    case 'GET_RECORDING_STATE': {
      return {
        isRecording,
        isPaused: isRecordingPaused,
        targetTabId,
      };
    }

    case 'RECORDED_COMMAND':
    case 'RECORD_STEP': {
      const command: SeleniumCommand = msg.command || msg.step;
      if (command) {
        // FIX 2: Frame Tracking from message sender
        if (typeof _sender.frameId === 'number') {
          command.frameId = _sender.frameId;
          command.isTopFrame = _sender.frameId === 0;
        } else if (typeof msg.isTopFrame === 'boolean') {
          command.isTopFrame = msg.isTopFrame;
          command.frameId = msg.isTopFrame ? 0 : command.frameId;
        }

        // Forward command to IDE window
        sendToIde({
          type: 'RECORDED_COMMAND',
          command,
        });
      }
      return { status: 'command_forwarded' };
    }

    case 'START_REPLAY': {
      startReplayProcess(msg.suite, msg.speed || 1, msg.startFromIndex || 0);
      return { status: 'replay_started' };
    }

    case 'PAUSE_REPLAY': {
      if (replayAbortController) {
        replayAbortController.paused = true;
        updateSessionState({ status: 'paused' });
        addLog('Replay paused by user.', 'warn');
      }
      return { status: 'paused' };
    }

    case 'RESUME_REPLAY': {
      if (replayAbortController) {
        replayAbortController.paused = false;
        updateSessionState({ status: 'replaying' });
        addLog('Replay resumed.', 'info');
      }
      return { status: 'resumed' };
    }

    case 'STOP_REPLAY': {
      stopReplay();
      return { status: 'stopped' };
    }

    case 'GET_SESSION_STATE': {
      return sessionState;
    }

    default:
      return { unhandled: true };
  }
}

// ============================================================================
// RECORDING FLOW WITH BASE URL
// ============================================================================
async function startRecordingFlow(rawBaseUrl: string, suiteId: string) {
  let baseUrl = (rawBaseUrl || 'https://example.com').trim();
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = 'https://' + baseUrl;
  }

  activeSuiteId = suiteId;

  addLog(`Creating managed target window for Base URL: ${baseUrl}`, 'info');

  // Create target tab / window
  const tab = await chrome.tabs.create({ url: baseUrl });
  targetTabId = tab.id || null;
  targetWindowId = tab.windowId || null;
  await updateRecordingSessionStorage(true, false, targetTabId);

  sendToIde({
    type: 'RECORDING_STATE_CHANGED',
    isRecording: true,
    isPaused: false,
    targetTabId,
  });

  // Emit Step 1: Open command
  const openCommand: SeleniumCommand = {
    id: 'cmd_' + Date.now(),
    command: 'open',
    target: baseUrl,
    status: 'passed',
    comment: 'Open Base URL',
  };

  sendToIde({
    type: 'RECORDED_COMMAND',
    command: openCommand,
  });

  addLog(`[Step 1] open -> ${baseUrl}`, 'success', 0);

  // Ensure recorder script is injected as soon as the target page completes loading
  if (targetTabId) {
    waitForTabComplete(targetTabId)
      .then(async () => {
        if (isRecording && !isRecordingPaused && targetTabId) {
          await ensureScriptInjected(targetTabId, 'content_scripts/recorder.js');
          chrome.tabs.sendMessage(targetTabId, { type: 'START_RECORDING' }).catch((err) => {
            console.debug(`[FlowMacro] Target tab ${targetTabId} START_RECORDING notice:`, err);
          });
        }
      })
      .catch((err) => {
        console.warn('[FlowMacro] Error during target tab initialization:', err);
      });
  }

  return { status: 'recording_active', targetTabId, openCommand };
}

async function pauseRecordingFlow() {
  if (!isRecording) return { status: 'not_recording' };
  await updateRecordingSessionStorage(true, true, targetTabId);

  if (targetTabId) {
    chrome.tabs.sendMessage(targetTabId, { type: 'PAUSE_RECORDING' }).catch((err) => {
      console.debug(`[FlowMacro] Target tab ${targetTabId} PAUSE_RECORDING notice:`, err);
    });
  }

  sendToIde({
    type: 'RECORDING_STATE_CHANGED',
    isRecording: true,
    isPaused: true,
    targetTabId,
  });

  addLog('Recording paused.', 'warn');
  return { status: 'recording_paused' };
}

async function resumeRecordingFlow() {
  if (!isRecording) return { status: 'not_recording' };
  await updateRecordingSessionStorage(true, false, targetTabId);

  if (targetTabId) {
    chrome.tabs.sendMessage(targetTabId, { type: 'RESUME_RECORDING' }).catch((err) => {
      console.debug(`[FlowMacro] Target tab ${targetTabId} RESUME_RECORDING notice:`, err);
    });
  }

  sendToIde({
    type: 'RECORDING_STATE_CHANGED',
    isRecording: true,
    isPaused: false,
    targetTabId,
  });

  addLog('Recording resumed.', 'info');
  return { status: 'recording_resumed' };
}

async function stopRecording() {
  if (targetTabId) {
    chrome.tabs.sendMessage(targetTabId, { type: 'STOP_RECORDING' }).catch((err) => {
      console.debug(`[FlowMacro] Target tab ${targetTabId} STOP_RECORDING notice:`, err);
    });
  }

  await updateRecordingSessionStorage(false, false, null);
  activeSuiteId = null;

  sendToIde({
    type: 'RECORDING_STATE_CHANGED',
    isRecording: false,
    isPaused: false,
    targetTabId: null,
  });

  addLog('Recording stopped and finalized.', 'info');
  return { status: 'recording_stopped' };
}

// ============================================================================
// MANIFEST V3 SERVICE WORKER KEEP-ALIVE ENGINE (FIX 4)
// ============================================================================
const REPLAY_KEEPALIVE_ALARM = 'flowmacro_replay_keepalive';

function startReplayKeepAlive() {
  try {
    if (chrome.alarms) {
      chrome.alarms.create(REPLAY_KEEPALIVE_ALARM, { periodInMinutes: 0.35 }); // ping every ~21 seconds
    }
  } catch (err) {
    console.debug('[FlowMacro] Keepalive alarm create notice:', err);
  }
}

function stopReplayKeepAlive() {
  try {
    if (chrome.alarms) {
      chrome.alarms.clear(REPLAY_KEEPALIVE_ALARM).catch(() => {});
      chrome.alarms.clear('flowmacro_interim_step_wait').catch(() => {});
    }
  } catch (err) {
    console.debug('[FlowMacro] Keepalive alarm clear notice:', err);
  }
}

if (chrome.alarms?.onAlarm) {
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === REPLAY_KEEPALIVE_ALARM || alarm.name === 'flowmacro_interim_step_wait') {
      if (sessionState.status === 'replaying') {
        try {
          if (chrome.storage?.session) {
            await chrome.storage.session.set({
              replayingKeepAlivePing: Date.now(),
              replayingStepIndex: currentReplayIndex,
            });
          }
        } catch (_) {}
      } else {
        stopReplayKeepAlive();
      }
    }
  });
}

function stopReplay() {
  stopReplayKeepAlive();
  if (replayAbortController) {
    replayAbortController.aborted = true;
    replayAbortController = null;
  }
  if (awaitingNavigationPromiseResolver) {
    awaitingNavigationPromiseResolver();
    awaitingNavigationPromiseResolver = null;
  }
  isAwaitingNavigationFlag = false;
  navigationStartedAt = null;
  activeSuite = null;
  updateSessionState({ status: 'idle' });
  persistSession();
  addLog('Replay stopped.', 'info');
}

// ============================================================================
// REPLAY ORCHESTRATION PIPELINE
// ============================================================================
async function startReplayProcess(
  suite: TestSuite,
  speed: number = 1,
  startFromIndex: number = 0
) {
  if (sessionState.status === 'replaying' && startFromIndex === 0) {
    console.warn('Replay already in progress');
    return;
  }

  startReplayKeepAlive();
  replayAbortController = { aborted: false, paused: false };
  activeSuite = suite;
  replaySpeed = speed;
  currentReplayIndex = startFromIndex;
  await persistSession();

  updateSessionState({
    suiteId: suite.id,
    status: 'replaying',
    currentStepIndex: startFromIndex,
    totalSteps: suite.commands.length,
    speed,
    logs: [
      {
        timestamp: Date.now(),
        message: `--- Starting Test: "${suite.name || 'Test Suite'}" ---`,
        type: 'info',
      },
    ],
  });

  // Ensure target tab exists
  if (!targetTabId) {
    const tab = await chrome.tabs.create({ url: suite.baseUrl });
    targetTabId = tab.id || null;
    targetWindowId = tab.windowId || null;
    await persistSession();
    await waitForTabComplete(targetTabId!);
  } else {
    // Focus target window
    if (targetWindowId) {
      chrome.windows.update(targetWindowId, { focused: true }).catch((err) => {
        console.debug('[AutoMacro] Target window focus notice:', err);
      });
    }
  }

  try {
    for (let i = startFromIndex; i < suite.commands.length; i++) {
      if (replayAbortController.aborted) break;

      // Handle Paused state
      while (replayAbortController.paused && !replayAbortController.aborted) {
        await new Promise((r) => setTimeout(r, 200));
      }
      if (replayAbortController.aborted) break;

      const cmd = suite.commands[i];
      currentReplayIndex = i;
      updateSessionState({ currentStepIndex: i });

      // FIX 4: Continuously refresh session storage to keep worker alive
      if (chrome.storage?.session) {
        chrome.storage.session.set({
          replayingStepIndex: i,
          lastReplayStepTime: Date.now(),
        }).catch(() => {});
      }
      await persistSession();

      // If long wait step, schedule interim wake-up alarm
      if (cmd.command === 'wait') {
        const waitMs = (parseInt(cmd.target) || 1000) / speed;
        if (waitMs > 15000 && chrome.alarms) {
          chrome.alarms.create('flowmacro_interim_step_wait', {
            delayInMinutes: Math.max(0.1, (waitMs / 60000) * 0.9),
          });
        }
      }

      // Notify IDE row is Executing
      sendToIde({
        type: 'STEP_STATUS_CHANGED',
        commandId: cmd.id,
        status: 'executing',
      });

      addLog(
        `[Step ${i + 1}/${suite.commands.length}] ${cmd.command.toUpperCase()}: ${cmd.target}`,
        'info',
        i
      );

      if (cmd.command === 'open') {
        const urlToOpen = cmd.target.startsWith('http')
          ? cmd.target
          : new URL(cmd.target, suite.baseUrl).href;
        await chrome.tabs.update(targetTabId!, { url: urlToOpen });
        await waitForTabComplete(targetTabId!);

        sendToIde({
          type: 'STEP_STATUS_CHANGED',
          commandId: cmd.id,
          status: 'passed',
        });
        addLog(`Step ${i + 1} passed (page opened).`, 'success', i);
      } else {
        // Execute in content script
        const result = await executeDomCommand(targetTabId!, cmd, speed);

        if (!result.success) {
          const failureDetail = `Step ${i + 1} [${cmd.command.toUpperCase()}: ${cmd.target}] failed: ${result.error || 'Unknown execution failure'}`;
          sendToIde({
            type: 'STEP_STATUS_CHANGED',
            commandId: cmd.id,
            status: 'failed',
            error: result.error || failureDetail,
          });
          throw new Error(failureDetail);
        }

        sendToIde({
          type: 'STEP_STATUS_CHANGED',
          commandId: cmd.id,
          status: 'passed',
        });
        addLog(`Step ${i + 1} passed.`, 'success', i);

        // If command caused navigation, wait for complete
        if (result.navigated) {
          addLog('Waiting for page navigation to complete...', 'info');
          isAwaitingNavigationFlag = true;
          navigationStartedAt = Date.now();
          await persistSession();

          await waitForTabComplete(targetTabId!, 8000);

          isAwaitingNavigationFlag = false;
          navigationStartedAt = null;
          awaitingNavigationPromiseResolver = null;
          await persistSession();

          // Re-inject replayer after navigation transition
          await ensureScriptInjected(targetTabId!, 'content_scripts/replayer.js');
        }
      }

      // Delay according to speed multiplier
      const stepDelay = Math.max(100, Math.floor(400 / speed));
      await new Promise((r) => setTimeout(r, stepDelay));
    }

    if (!replayAbortController.aborted) {
      addLog(`Test "${suite.name || 'Test Suite'}" completed successfully!`, 'success');
      updateSessionState({ status: 'completed' });
    }
  } catch (err: any) {
    addLog(`Replay Error: ${err.message || String(err)}`, 'error');
    updateSessionState({ status: 'error', error: err.message || String(err) });
  } finally {
    stopReplayKeepAlive();
    replayAbortController = null;
    activeSuite = null;
    await persistSession();
  }
}

async function dispatchCommandToTab(
  tabId: number,
  command: SeleniumCommand,
  speed: number,
  timeoutMs: number = 6000
): Promise<{ success: boolean; error?: string; navigated?: boolean } | null> {
  const sendOptions =
    typeof command.frameId === 'number' && command.frameId > 0
      ? { frameId: command.frameId }
      : undefined;

  try {
    const payload = {
      type: 'EXECUTE_DOM_COMMAND',
      command,
      speed,
      timeoutMs,
    };
    const res = sendOptions
      ? await chrome.tabs.sendMessage(tabId, payload, sendOptions)
      : await chrome.tabs.sendMessage(tabId, payload);
    if (res) return res;
  } catch (frameErr: any) {
    // FIX 2: If targeted dispatch to frameId failed (frame reloaded/detached), fall back to top frame
    if (sendOptions) {
      console.debug(`[FlowMacro] Frame ${command.frameId} dispatch notice, falling back:`, frameErr);
      const fallbackRes = await chrome.tabs.sendMessage(tabId, {
        type: 'EXECUTE_DOM_COMMAND',
        command,
        speed,
        timeoutMs,
      });
      if (fallbackRes) return fallbackRes;
    } else {
      throw frameErr;
    }
  }
  return null;
}

async function executeDomCommand(
  tabId: number,
  command: SeleniumCommand,
  speed: number
): Promise<{ success: boolean; error?: string; navigated?: boolean }> {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab && tab.status === 'loading') {
      addLog(`[Navigation] Tab is loading, awaiting completion...`, 'info');
      await waitForTabComplete(tabId, 6000);
    }
  } catch (tabErr: any) {
    console.debug(`[AutoMacro] Target tab get status check notice:`, tabErr);
  }

  // Attempt 1
  try {
    await ensureScriptInjected(tabId, 'content_scripts/replayer.js');
    const response = await dispatchCommandToTab(tabId, command, speed, 6000);
    return response || { success: false, error: `No response from replayer for [${command.target}]` };
  } catch (err: any) {
    // Attempt 2: Page may be transitioning or reloading
    try {
      addLog(`[Replayer] Re-syncing replayer on tab (Attempt 2 for [${command.target}]): ${err.message || String(err)}`, 'info');
      await waitForTabComplete(tabId, 5000);
      await new Promise((r) => setTimeout(r, 200));
      await ensureScriptInjected(tabId, 'content_scripts/replayer.js');
      const response = await dispatchCommandToTab(tabId, command, speed, 6000);
      return response || { success: false, error: `No response on replayer retry for [${command.target}]` };
    } catch (retryErr: any) {
      // Attempt 3: Final attempt with longer stabilization
      try {
        addLog(`[Replayer] Re-syncing replayer on tab (Attempt 3 for [${command.target}]): ${retryErr.message || String(retryErr)}`, 'info');
        await new Promise((r) => setTimeout(r, 400));
        await waitForTabComplete(tabId, 5000);
        await ensureScriptInjected(tabId, 'content_scripts/replayer.js');
        const response = await dispatchCommandToTab(tabId, command, speed, 6000);
        return response || { success: false, error: `No response on final replayer retry for [${command.target}]` };
      } catch (finalErr: any) {
        const errorMsg = `DOM execution failed for target [${command.target}]: ${finalErr.message || String(finalErr)}`;
        addLog(errorMsg, 'error');
        return { success: false, error: errorMsg };
      }
    }
  }
}

async function waitForTabComplete(tabId: number, maxWaitMs: number = 8000): Promise<void> {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab && tab.status === 'complete') {
      return;
    }
  } catch (tabErr: any) {
    console.debug(`[AutoMacro] Tab get completion check notice (tabId ${tabId}):`, tabErr);
  }

  return new Promise((resolve) => {
    const listener = (updatedTabId: number, changeInfo: chrome.tabs.TabChangeInfo) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
    setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    }, maxWaitMs);
  });
}

function updateSessionState(patch: Partial<ReplaySessionState>) {
  sessionState = { ...sessionState, ...patch };
  persistSession();
  sendToIde({
    type: 'SESSION_STATE_UPDATE',
    state: sessionState,
  });
}

function addLog(message: string, type: 'info' | 'warn' | 'error' | 'success', stepIndex?: number) {
  const log: ExecutionLog = {
    timestamp: Date.now(),
    message,
    type,
    stepIndex,
  };
  sessionState.logs.push(log);
  if (sessionState.logs.length > 250) {
    sessionState.logs.shift();
  }
  updateSessionState({ logs: [...sessionState.logs] });
}

function sendToIde(message: any) {
  if (ideTabId) {
    chrome.tabs.sendMessage(ideTabId, message).catch((err) => {
      console.debug('[AutoMacro] Notice: IDE tab message not received:', err);
    });
  }
  // Also runtime broadcast
  chrome.runtime.sendMessage(message).catch((err) => {
    console.debug('[AutoMacro] Notice: Runtime broadcast not received:', err);
  });
}

async function ensureScriptInjected(tabId: number, scriptPath: string) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: [scriptPath],
    });
  } catch (e) {
    console.warn(`Injection notice (${scriptPath}):`, e);
  }
}
