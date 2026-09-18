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
// PAGE LIFECYCLE SYNC (chrome.tabs.onUpdated)
// ============================================================================
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  await rehydrationPromise;

  if (tabId !== targetTabId) return;

  if (changeInfo.status === 'complete') {
    // If recording on target tab, ensure recorder script is injected
    if (isRecording) {
      await ensureScriptInjected(tabId, 'content_scripts/recorder.js');
      chrome.tabs.sendMessage(tabId, { type: 'START_RECORDING' }).catch((err) => {
        console.debug(`[AutoMacro] Tab ${tabId} START_RECORDING notice:`, err);
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

  switch (msg.type) {
    case 'START_RECORDING': {
      return await startRecordingFlow(msg.baseUrl, msg.suiteId);
    }

    case 'STOP_RECORDING': {
      return await stopRecording();
    }

    case 'RECORDED_COMMAND': {
      const command: SeleniumCommand = msg.command;
      // Forward command to IDE window
      sendToIde({
        type: 'RECORDED_COMMAND',
        command,
      });
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

  isRecording = true;
  activeSuiteId = suiteId;

  addLog(`Creating managed target window for Base URL: ${baseUrl}`, 'info');

  // Create target tab / window
  const tab = await chrome.tabs.create({ url: baseUrl });
  targetTabId = tab.id || null;
  targetWindowId = tab.windowId || null;
  await persistSession();

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
        if (isRecording && targetTabId) {
          await ensureScriptInjected(targetTabId, 'content_scripts/recorder.js');
          chrome.tabs.sendMessage(targetTabId, { type: 'START_RECORDING' }).catch((err) => {
            console.debug(`[AutoMacro] Target tab ${targetTabId} START_RECORDING notice:`, err);
          });
        }
      })
      .catch((err) => {
        console.warn('[AutoMacro] Error during target tab initialization:', err);
      });
  }

  return { status: 'recording_active', targetTabId, openCommand };
}

async function stopRecording() {
  isRecording = false;
  activeSuiteId = null;
  await persistSession();

  if (targetTabId) {
    chrome.tabs.sendMessage(targetTabId, { type: 'STOP_RECORDING' }).catch((err) => {
      console.debug(`[AutoMacro] Target tab ${targetTabId} STOP_RECORDING notice:`, err);
    });
  }

  addLog('Recording stopped.', 'info');
  return { status: 'recording_stopped' };
}

function stopReplay() {
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
      await persistSession();

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
    replayAbortController = null;
    activeSuite = null;
    await persistSession();
  }
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
    const response = await chrome.tabs.sendMessage(tabId, {
      type: 'EXECUTE_DOM_COMMAND',
      command,
      speed,
      timeoutMs: 6000,
    });
    return response || { success: false, error: `No response from replayer for [${command.target}]` };
  } catch (err: any) {
    // Attempt 2: Page may be transitioning or reloading
    try {
      addLog(`[Replayer] Re-syncing replayer on tab (Attempt 2 for [${command.target}]): ${err.message || String(err)}`, 'info');
      await waitForTabComplete(tabId, 5000);
      await new Promise((r) => setTimeout(r, 200));
      await ensureScriptInjected(tabId, 'content_scripts/replayer.js');
      const response = await chrome.tabs.sendMessage(tabId, {
        type: 'EXECUTE_DOM_COMMAND',
        command,
        speed,
        timeoutMs: 6000,
      });
      return response || { success: false, error: `No response on replayer retry for [${command.target}]` };
    } catch (retryErr: any) {
      // Attempt 3: Final attempt with longer stabilization
      try {
        addLog(`[Replayer] Re-syncing replayer on tab (Attempt 3 for [${command.target}]): ${retryErr.message || String(retryErr)}`, 'info');
        await new Promise((r) => setTimeout(r, 400));
        await waitForTabComplete(tabId, 5000);
        await ensureScriptInjected(tabId, 'content_scripts/replayer.js');
        const response = await chrome.tabs.sendMessage(tabId, {
          type: 'EXECUTE_DOM_COMMAND',
          command,
          speed,
          timeoutMs: 6000,
        });
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
