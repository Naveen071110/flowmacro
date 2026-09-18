import { SeleniumCommand, CommandType } from '../types/macro';
import { encryptSecret } from '../shared/crypto';

(() => {
  if ((window as any).__AUTOMACRO_RECORDER_LOADED__) return;
  (window as any).__AUTOMACRO_RECORDER_LOADED__ = true;

  let isRecording = false;
  let inputDebounceTimer: any = null;
  let lastRecordedInput: { el: HTMLElement; value: string; cmdId: string } | null = null;
  let lastClickTimestamp = 0;

  // Listen for direct runtime messages
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'START_RECORDING') {
      isRecording = true;
      showHudNotification('AutoMacro IDE: Recording Attached');
      sendResponse({ status: 'ok' });
    } else if (msg.type === 'STOP_RECORDING') {
      flushPendingInput();
      isRecording = false;
      showHudNotification('AutoMacro IDE: Recording Stopped');
      sendResponse({ status: 'ok' });
    }
    return true;
  });

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
        type: 'RECORDED_COMMAND',
        command,
      }).catch((err) => {
        console.warn('[AutoMacro Recorder] Error sending RECORDED_COMMAND:', err);
      });
    } catch (err) {
      console.warn('[AutoMacro Recorder] Exception posting recorded command:', err);
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

  // Click capture
  window.addEventListener(
    'click',
    (e) => {
      if (!isRecording) return;
      const target = e.target as HTMLElement;
      if (!target) return;
      if (target.closest('#automacro-hud-container')) return;

      // Synchronously flush any pending input before recording click/submit
      flushPendingInput();

      const now = Date.now();
      if (now - lastClickTimestamp < 60) return;
      lastClickTimestamp = now;

      // Ignore text input click (captured on input)
      if (
        target.tagName === 'INPUT' &&
        ['text', 'password', 'email', 'search', 'tel'].includes((target as HTMLInputElement).type)
      ) {
        return;
      }

      recordCommand('click', target);
    },
    true
  );

  // Input debounced capture
  window.addEventListener(
    'input',
    (e) => {
      if (!isRecording) return;
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      if (!target || !('value' in target)) return;
      if (target.closest('#automacro-hud-container')) return;

      lastRecordedInput = {
        el: target,
        value: target.value,
        cmdId: lastRecordedInput?.cmdId || '',
      };

      if (inputDebounceTimer) clearTimeout(inputDebounceTimer);
      inputDebounceTimer = setTimeout(() => {
        flushPendingInput();
      }, 650);
    },
    true
  );

  // Select change
  window.addEventListener(
    'change',
    (e) => {
      if (!isRecording) return;
      const target = e.target as HTMLInputElement | HTMLSelectElement;
      if (!target) return;
      if (target.closest('#automacro-hud-container')) return;

      flushPendingInput();

      if (target.tagName === 'SELECT') {
        const select = target as HTMLSelectElement;
        const selectedText = select.options[select.selectedIndex]?.text || select.value;
        recordCommand('select', target, `label=${selectedText}`);
      }
    },
    true
  );

  // Enter key for form submit
  window.addEventListener(
    'keydown',
    (e) => {
      if (!isRecording) return;
      if (e.key === 'Enter') {
        // Synchronously flush pending input before recording form submit
        flushPendingInput();
        const target = e.target as HTMLElement;
        if (target && target.closest('form')) {
          recordCommand('submit', target.closest('form')!);
        }
      }
    },
    true
  );

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
