import { SeleniumCommand, CommandType } from '../types/macro';
import { encryptSecret } from '../shared/crypto';

(() => {
  if ((window as any).__FLOWMACRO_RECORDER_LOADED__) return;
  (window as any).__FLOWMACRO_RECORDER_LOADED__ = true;
  (window as any).__AUTOMACRO_RECORDER_LOADED__ = true;

  let isRecording = false;
  let isPaused = false;
  let listenersAttached = false;
  let inputDebounceTimer: any = null;
  let lastRecordedInput: { el: HTMLElement; value: string; cmdId: string } | null = null;
  let lastClickTimestamp = 0;

  function checkStorageAndAutoAttach() {
    const storage = chrome.storage?.session || chrome.storage?.local;
    if (!storage) return;

    storage.get(['isRecording', 'isPaused', 'targetTabId'], (state: any) => {
      if (chrome.runtime?.lastError) return;
      if (state && state.isRecording && !state.isPaused) {
        isRecording = true;
        isPaused = false;
        attachRecorderListeners();
      } else if (state && state.isRecording && state.isPaused) {
        isRecording = true;
        isPaused = true;
        detachRecorderListeners();
      }
    });
  }

  // Listen for direct runtime messages
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    const action = msg.type || msg.action;
    if (action === 'START_RECORDING' || action === 'RESUME_RECORDING') {
      isRecording = true;
      isPaused = false;
      attachRecorderListeners();
      showHudNotification(action === 'RESUME_RECORDING' ? 'FlowMacro: Recording Resumed' : 'FlowMacro: Recording Active');
      sendResponse({ status: 'ok' });
    } else if (action === 'PAUSE_RECORDING') {
      flushPendingInput();
      isPaused = true;
      detachRecorderListeners();
      showHudNotification('FlowMacro: Recording Paused');
      sendResponse({ status: 'ok' });
    } else if (action === 'STOP_RECORDING') {
      flushPendingInput();
      isRecording = false;
      isPaused = false;
      detachRecorderListeners();
      showHudNotification('FlowMacro: Recording Stopped');
      sendResponse({ status: 'ok' });
    }
    return true;
  });

  // Storage listener to react immediately across tabs / navigations
  if (chrome.storage?.onChanged) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'session' || area === 'local') {
        if (changes.isRecording !== undefined || changes.isPaused !== undefined) {
          const storage = chrome.storage?.session || chrome.storage?.local;
          storage.get(['isRecording', 'isPaused'], (state: any) => {
            if (chrome.runtime?.lastError) return;
            if (state && state.isRecording && !state.isPaused) {
              isRecording = true;
              isPaused = false;
              attachRecorderListeners();
            } else if (state && state.isRecording && state.isPaused) {
              isRecording = true;
              isPaused = true;
              detachRecorderListeners();
            } else {
              isRecording = false;
              isPaused = false;
              detachRecorderListeners();
            }
          });
        }
      }
    });
  }

  // Auto-attach on script load (upon page navigation/reload)
  checkStorageAndAutoAttach();

  // ============================================================================
  // SELECTOR WATERFALL & TARGET GENERATOR
  // Order: data-testid -> ID -> ARIA -> Name -> CSS Path -> XPath
  // ============================================================================
  function generateTargets(element: Element): {
    primary: string;
    targets: Array<[string, string]>;
  } {
    const list: Array<[string, string]> = [];

    // 1. data-testid / test attributes
    const testAttrs = ['data-testid', 'data-test', 'data-cy', 'data-qa'];
    for (const attr of testAttrs) {
      const val = element.getAttribute(attr);
      if (val) {
        list.push([`css=[${attr}="${val}"]`, attr]);
        break;
      }
    }

    // 2. ID
    if (element.id && typeof element.id === 'string') {
      const isDynamic =
        /(:r[0-9a-z]+:|\b[a-f0-9]{8,}\b|mui-|ember|react-|radix-)/i.test(element.id) ||
        /\d{4,}/.test(element.id);
      if (!isDynamic) {
        try {
          if (document.querySelectorAll(`#${CSS.escape(element.id)}`).length === 1) {
            list.push([`id=${element.id}`, 'id']);
          }
        } catch (err) {
          console.debug('[AutoMacro Recorder] Failed to query ID selector:', err);
        }
      }
    }

    // 3. ARIA attributes (aria-label, role, aria-labelledby)
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
      try {
        if (document.querySelectorAll(`[aria-label="${CSS.escape(ariaLabel)}"]`).length === 1) {
          list.push([`css=[aria-label="${ariaLabel}"]`, 'aria-label']);
        }
      } catch (err) {
        console.debug('[AutoMacro Recorder] Failed to query aria-label selector:', err);
      }
    }
    const role = element.getAttribute('role');
    if (role && ariaLabel) {
      try {
        if (
          document.querySelectorAll(`[role="${CSS.escape(role)}"][aria-label="${CSS.escape(ariaLabel)}"]`).length === 1
        ) {
          list.push([`css=[role="${role}"][aria-label="${ariaLabel}"]`, 'role']);
        }
      } catch (err) {
        console.debug('[AutoMacro Recorder] Failed to query role selector:', err);
      }
    }

    // 4. Name attribute
    const name = element.getAttribute('name');
    if (name) {
      list.push([`name=${name}`, 'name']);
    }

    // 5. Clean CSS Path
    const cssPath = generateCssPath(element);
    list.push([`css=${cssPath}`, 'css:finder']);

    // 6. XPath
    const xpath = generateXPath(element);
    if (xpath) {
      list.push([`xpath=${xpath}`, 'xpath:position']);
    }

    const primary = list.length > 0 ? list[0][0] : element.tagName.toLowerCase();
    return { primary, targets: list };
  }

  function generateCssPath(el: Element): string {
    if (el.id && !/\d{4,}/.test(el.id)) {
      try {
        if (document.querySelectorAll(`#${CSS.escape(el.id)}`).length === 1) {
          return `#${CSS.escape(el.id)}`;
        }
      } catch (err) {
        console.debug('[AutoMacro Recorder] CSS path ID query notice:', err);
      }
    }

    const path: string[] = [];
    let current: Element | null = el;

    while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      const classes = Array.from(current.classList).filter(
        (c) =>
          !c.startsWith('hover:') &&
          !c.startsWith('focus:') &&
          !c.startsWith('dark:') &&
          !c.startsWith('sm:') &&
          !c.startsWith('md:') &&
          !c.startsWith('lg:') &&
          !/^[0-9a-f]{8,}$/i.test(c) &&
          c.length < 25
      );

      if (classes.length > 0) {
        selector += `.${classes.slice(0, 2).map((c) => CSS.escape(c)).join('.')}`;
      }

      let sibling: Element | null | undefined = current.parentElement?.firstElementChild;
      let count = 0;
      let index = 1;
      while (sibling) {
        if (sibling.tagName === current.tagName) {
          count++;
          if (sibling === current) index = count;
        }
        sibling = sibling.nextElementSibling;
      }
      if (count > 1) {
        selector += `:nth-of-type(${index})`;
      }

      path.unshift(selector);
      if (path.length >= 3) break;
      current = current.parentElement;
    }

    return path.join(' > ');
  }

  function generateXPath(el: Element): string {
    if (el.nodeType !== Node.ELEMENT_NODE) return '';
    if (el === document.body) return '//body';

    let index = 1;
    let sibling = el.previousElementSibling;
    while (sibling) {
      if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === el.tagName) {
        index++;
      }
      sibling = sibling.previousElementSibling;
    }

    const tagName = el.tagName.toLowerCase();
    const parentPath = el.parentElement && el.parentElement !== document.body ? generateXPath(el.parentElement) : '';
    return `${parentPath}//${tagName}[${index}]`;
  }

  // ============================================================================
  // SENSITIVE CREDENTIAL CHECK
  // ============================================================================
  function isSensitiveField(element: HTMLElement): boolean {
    if (element.tagName === 'INPUT') {
      const input = element as HTMLInputElement;
      if (input.type === 'password') return true;
    }
    const autocomplete = (element.getAttribute('autocomplete') || '').toLowerCase();
    if (
      autocomplete.includes('password') ||
      autocomplete.includes('current-password') ||
      autocomplete.includes('new-password')
    ) {
      return true;
    }

    const testStr = `${element.id} ${element.getAttribute('name') || ''} ${element.getAttribute('aria-label') || ''} ${element.getAttribute('placeholder') || ''}`.toLowerCase();
    return /(password|passwd|secret|apikey|api_key|token|auth_token|pin|cvv)/i.test(testStr);
  }

  // ============================================================================
  // COMMAND RECORDING
  // ============================================================================
  async function recordCommand(
    commandType: CommandType,
    target: Element,
    value?: string,
    comment?: string
  ) {
    if (!isRecording) return;

    const { primary, targets } = generateTargets(target);
    const cmdId = 'cmd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const isSensitive = target instanceof HTMLElement && isSensitiveField(target);

    let finalValue = value;
    let encryptedSecret: { ciphertext: string; iv: string } | undefined;
    let envVarName: string | undefined;

    if (isSensitive) {
      envVarName = 'SECRET_PASSWORD';
      const placeholder = `{{${envVarName}}}`;
      if (value) {
        try {
          encryptedSecret = await encryptSecret(value);
        } catch (e) {
          console.warn('Vault encryption notice:', e);
        }
      }
      finalValue = placeholder;
    }

    const command: SeleniumCommand = {
      id: cmdId,
      command: commandType,
      target: primary,
      targets,
      value: finalValue,
      sessionSecret: isSensitive ? value : undefined,
      status: 'pending',
      comment: comment || (isSensitive ? 'Type [PROTECTED_SECRET]' : undefined),
      isSensitive: isSensitive ? true : undefined,
      encryptedSecret,
      envVarName,
    };

    flashTarget(target as HTMLElement, isSensitive);

    try {
      chrome.runtime.sendMessage({
        action: 'RECORD_STEP',
        type: 'RECORDED_COMMAND',
        command,
        step: command,
      }).catch((err) => {
        console.debug('[FlowMacro Recorder] Notice sending recorded command:', err);
      });
    } catch (err) {
      console.debug('[FlowMacro Recorder] Exception posting recorded command:', err);
    }
  }

  function flushPendingInput() {
    if (inputDebounceTimer) {
      clearTimeout(inputDebounceTimer);
      inputDebounceTimer = null;
    }
    if (lastRecordedInput) {
      const targetEl = lastRecordedInput.el as HTMLInputElement | HTMLTextAreaElement;
      const currentValue = targetEl && 'value' in targetEl ? targetEl.value : lastRecordedInput.value;
      const el = lastRecordedInput.el;
      lastRecordedInput = null;
      recordCommand('type', el, currentValue);
    }
  }

  // ============================================================================
  // EVENT LISTENERS HANDLERS
  // ============================================================================
  function handleClick(e: MouseEvent) {
    if (!isRecording || isPaused) return;
    const rawTarget = e.target as HTMLElement | SVGElement | null;
    if (!rawTarget) return;
    if (rawTarget.closest?.('#automacro-hud-container, #flowmacro-hud-container')) return;

    // Synchronously flush any pending input before recording click/submit
    flushPendingInput();

    const now = Date.now();
    if (now - lastClickTimestamp < 60) return;
    lastClickTimestamp = now;

    // Handle SVG elements & clickable button/link containers:
    // If user clicks a nested <svg>, <path>, or <span> inside a button or link, target the interactive container
    const interactiveContainer = rawTarget.closest?.(
      'button, a, input, select, textarea, [role="button"], [role="link"], [role="menuitem"], [role="tab"]'
    );
    const target = (interactiveContainer as HTMLElement) || (rawTarget as HTMLElement);

    // Ignore text input click (captured on input/change)
    if (
      target.tagName === 'INPUT' &&
      ['text', 'password', 'email', 'search', 'tel', 'url', 'number'].includes((target as HTMLInputElement).type)
    ) {
      return;
    }

    recordCommand('click', target);
  }

  function handleInput(e: Event) {
    if (!isRecording || isPaused) return;
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    if (!target || !('value' in target)) return;
    if (target.closest?.('#automacro-hud-container, #flowmacro-hud-container')) return;

    lastRecordedInput = {
      el: target,
      value: target.value,
      cmdId: lastRecordedInput?.cmdId || '',
    };

    if (inputDebounceTimer) clearTimeout(inputDebounceTimer);
    inputDebounceTimer = setTimeout(() => {
      flushPendingInput();
    }, 650);
  }

  function handleChange(e: Event) {
    if (!isRecording || isPaused) return;
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    if (!target) return;
    if (target.closest?.('#automacro-hud-container, #flowmacro-hud-container')) return;

    flushPendingInput();

    if (target.tagName === 'SELECT') {
      const select = target as HTMLSelectElement;
      const selectedText = select.options[select.selectedIndex]?.text || select.value;
      recordCommand('select', target, `label=${selectedText}`);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!isRecording || isPaused) return;
    if (e.key === 'Enter') {
      // Synchronously flush pending input before recording form submit
      flushPendingInput();
      const target = e.target as HTMLElement;
      if (target && target.closest?.('form')) {
        recordCommand('submit', target.closest('form')!);
      }
    }
  }

  function handleSubmit(e: Event) {
    if (!isRecording || isPaused) return;
    flushPendingInput();
    const form = e.target as HTMLFormElement;
    if (form) {
      recordCommand('submit', form);
    }
  }

  function handleBeforeUnload() {
    flushPendingInput();
  }

  function attachRecorderListeners() {
    if (listenersAttached) return;
    window.addEventListener('click', handleClick, true);
    window.addEventListener('input', handleInput, true);
    window.addEventListener('change', handleChange, true);
    window.addEventListener('keydown', handleKeydown, true);
    window.addEventListener('submit', handleSubmit, true);
    window.addEventListener('beforeunload', handleBeforeUnload, true);
    window.addEventListener('pagehide', handleBeforeUnload, true);
    listenersAttached = true;
  }

  function detachRecorderListeners() {
    flushPendingInput();
    if (!listenersAttached) return;
    window.removeEventListener('click', handleClick, true);
    window.removeEventListener('input', handleInput, true);
    window.removeEventListener('change', handleChange, true);
    window.removeEventListener('keydown', handleKeydown, true);
    window.removeEventListener('submit', handleSubmit, true);
    window.removeEventListener('beforeunload', handleBeforeUnload, true);
    window.removeEventListener('pagehide', handleBeforeUnload, true);
    listenersAttached = false;
  }

  // ============================================================================
  // HUD & FLASH
  // ============================================================================
  function flashTarget(el: HTMLElement, isSensitive?: boolean) {
    const originalTransition = el.style.transition;
    const originalOutline = el.style.outline;
    const originalOutlineOffset = el.style.outlineOffset;

    el.style.transition = 'outline 0.15s ease-out';
    el.style.outline = isSensitive ? '2px solid #f59e0b' : '2px solid #22c55e';
    el.style.outlineOffset = '2px';

    setTimeout(() => {
      el.style.outline = originalOutline;
      el.style.outlineOffset = originalOutlineOffset;
      el.style.transition = originalTransition;
    }, 450);
  }

  function showHudNotification(text: string) {
    let hud = document.getElementById('automacro-hud-container');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'automacro-hud-container';
      hud.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 2147483647;
        background: #09090b;
        color: #f4f4f5;
        border: 1px solid #22c55e;
        padding: 8px 14px;
        border-radius: 6px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        font-size: 12px;
        font-weight: 500;
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        gap: 8px;
        pointer-events: none;
        transition: all 0.2s ease;
      `;
      document.body.appendChild(hud);
    }

    hud.innerHTML = `
      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 8px #22c55e;"></span>
      <span>${text}</span>
    `;
    hud.style.opacity = '1';

    setTimeout(() => {
      if (hud) hud.style.opacity = '0';
    }, 2500);
  }
})();
