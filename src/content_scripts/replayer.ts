import { SeleniumCommand } from '../types/macro';
import { decryptSecret } from '../shared/crypto';

(() => {
  if ((window as any).__AUTOMACRO_REPLAYER_LOADED__) return;
  (window as any).__AUTOMACRO_REPLAYER_LOADED__ = true;

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === 'EXECUTE_DOM_COMMAND') {
      executeSeleniumCommand(msg.command, msg.speed || 1, msg.timeoutMs || 5000)
        .then((result) => sendResponse(result))
        .catch((err) => {
          const errMsg = err.message || String(err);
          console.error(`[FlowMacro Replayer] Command execution failed:`, errMsg);
          sendResponse({
            success: false,
            commandId: msg.command.id,
            error: errMsg,
          });
        });
      return true;
    }
  });

  // ============================================================================
  // TARGET RESOLVER WITH WATERFALL FALLBACK
  // ============================================================================
  async function resolveTargetElement(
    primaryTarget: string,
    candidates?: Array<[string, string]>,
    timeoutMs: number = 5000
  ): Promise<HTMLElement> {
    const startTime = Date.now();

    const targetsToTry: string[] = [primaryTarget];
    if (candidates) {
      candidates.forEach(([sel]) => {
        if (sel && !targetsToTry.includes(sel)) targetsToTry.push(sel);
      });
    }

    while (Date.now() - startTime < timeoutMs) {
      for (const targetStr of targetsToTry) {
        if (!targetStr) continue;
        const el = queryDomBySeleniumTarget(targetStr);
        if (el && isElementUsable(el)) {
          return el as HTMLElement;
        }
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    const triedList = targetsToTry.map((t) => `"${t}"`).join(', ');
    throw new Error(`Target not found in DOM within ${timeoutMs}ms. Attempted locators: [${triedList}]`);
  }

  // ============================================================================
  // SHADOW DOM PIERCING & DEEP RESOLUTION (FIX 1)
  // ============================================================================
  function resolveShadowPierceTarget(target: string, rootDoc: Document = document): Element | null {
    try {
      const clean = target.replace(/^shadow=/, '').replace(/^css=/, '');
      const parts = clean.split('>>>').map((p) => p.trim()).filter(Boolean);
      if (parts.length === 0) return null;

      let currentContext: Document | Element | ShadowRoot = rootDoc;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i < parts.length - 1) {
          // Looking for a shadow host
          const host: Element | null =
            queryDomInDocument(part, currentContext) || queryDomDeep(part, currentContext);
          if (!host || !host.shadowRoot) return null;
          currentContext = host.shadowRoot;
        } else {
          // Final target element inside shadow root
          return queryDomInDocument(part, currentContext) || queryDomDeep(part, currentContext);
        }
      }
    } catch (err) {
      console.debug('[FlowMacro Replayer] Shadow pierce resolution notice:', err);
    }
    return null;
  }

  function queryDomDeep(target: string, root: Document | Element | ShadowRoot = document): Element | null {
    const direct = queryDomInDocument(target, root);
    if (direct) return direct;

    try {
      const allElements = (root as any).querySelectorAll ? (root as any).querySelectorAll('*') : [];
      for (const el of allElements) {
        if (el.shadowRoot) {
          const found = queryDomDeep(target, el.shadowRoot);
          if (found) return found;
        }
      }
    } catch (deepErr) {
      console.debug('[FlowMacro Replayer] Deep shadow search notice:', deepErr);
    }

    return null;
  }

  function queryDomBySeleniumTarget(target: string, rootDoc: Document = document): Element | null {
    // 1. If target specifies shadow-piercing locator
    if (target.startsWith('shadow=') || target.includes(' >>> ')) {
      const shadowEl = resolveShadowPierceTarget(target, rootDoc);
      if (shadowEl) return shadowEl;
    }

    // 2. Direct document query
    const el = queryDomInDocument(target, rootDoc);
    if (el) return el;

    // 3. Fallback: Deep Shadow DOM search across all open shadow hosts
    const deepEl = queryDomDeep(target, rootDoc);
    if (deepEl) return deepEl;

    // 4. Search same-origin iframes
    try {
      const iframes = Array.from(rootDoc.querySelectorAll('iframe'));
      for (const iframe of iframes) {
        try {
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            const found = queryDomBySeleniumTarget(target, iframeDoc);
            if (found) return found;
          }
        } catch (iframeErr) {
          // Cross-origin iframe boundary; safely ignore
          console.debug('[FlowMacro Replayer] Cross-origin iframe boundary notice:', iframeErr);
        }
      }
    } catch (frameSearchErr) {
      console.warn('[FlowMacro Replayer] Error searching same-origin iframes:', frameSearchErr);
    }

    return null;
  }

  function queryDomInDocument(target: string, doc: Document | Element | ShadowRoot): Element | null {
    try {
      if (!doc || typeof (doc as any).querySelector !== 'function') return null;

      if (target.startsWith('id=')) {
        const idVal = target.replace(/^id=/, '');
        if ('getElementById' in doc && typeof (doc as Document).getElementById === 'function') {
          const byId = (doc as Document).getElementById(idVal);
          if (byId) return byId;
        }
        return doc.querySelector(`#${CSS.escape(idVal)}`);
      }

      if (target.startsWith('name=')) {
        const nameVal = target.replace(/^name=/, '');
        return doc.querySelector(`[name="${CSS.escape(nameVal)}"]`);
      }

      if (target.startsWith('css=')) {
        const cssVal = target.replace(/^css=/, '');
        try {
          const direct = doc.querySelector(cssVal);
          if (direct) return direct;
        } catch (_) {}

        // Fallback 1: If selector contains emojis / non-ASCII unicode characters (e.g. Clerk's 🔒️),
        // strip them from class identifiers and retry query
        if (/[^\x00-\x7F]/.test(cssVal)) {
          try {
            const sanitized = cssVal.replace(/\.[a-zA-Z0-9_-]*[^\x00-\x7F\s>+~#.:\[\]]+[a-zA-Z0-9_-]*/g, '');
            if (sanitized && sanitized !== cssVal) {
              const cleanedEl = doc.querySelector(sanitized);
              if (cleanedEl) return cleanedEl;
            }
          } catch (_) {}
        }

        // Fallback 2: If selector targeted a button and failed (e.g. positional index shifted),
        // look for primary action or submit button in the container
        if (cssVal.includes('button')) {
          try {
            const btn = doc.querySelector('button[type="submit"], button.cl-formButtonPrimary, button.btn-primary');
            if (btn) return btn;
          } catch (_) {}
        }

        return null;
      }

      if (target.startsWith('xpath=')) {
        const xpathVal = target.replace(/^xpath=/, '');
        if ('evaluate' in doc && typeof (doc as Document).evaluate === 'function') {
          try {
            const res = (doc as Document).evaluate(xpathVal, doc as Document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            if (res.singleNodeValue) return res.singleNodeValue as Element;
          } catch (xpathErr) {
            console.debug('[FlowMacro Replayer] XPath evaluation error:', xpathErr);
          }
        }
      }

      if (target.startsWith('linkText=')) {
        const text = target.replace(/^linkText=/, '');
        const links = Array.from(doc.querySelectorAll('a'));
        return links.find((a) => a.textContent?.trim() === text) || null;
      }

      if (target.startsWith('//') || target.startsWith('(')) {
        if ('evaluate' in doc && typeof (doc as Document).evaluate === 'function') {
          try {
            const res = (doc as Document).evaluate(target, doc as Document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            if (res.singleNodeValue) return res.singleNodeValue as Element;
          } catch (_) {}
        }
      }

      // Default to standard CSS selector
      try {
        const defaultEl = doc.querySelector(target);
        if (defaultEl) return defaultEl;
      } catch (_) {}

      if (/[^\x00-\x7F]/.test(target)) {
        try {
          const sanitized = target.replace(/\.[a-zA-Z0-9_-]*[^\x00-\x7F\s>+~#.:\[\]]+[a-zA-Z0-9_-]*/g, '');
          if (sanitized && sanitized !== target) {
            const cleanedEl = doc.querySelector(sanitized);
            if (cleanedEl) return cleanedEl;
          }
        } catch (_) {}
      }
      return null;
    } catch (syntaxErr) {
      console.warn(`[FlowMacro Replayer] Selector evaluation failed for "${target}":`, syntaxErr);
      return null;
    }
  }

  function isElementUsable(el: Element): boolean {
    const rect = el.getBoundingClientRect();
    const win = el.ownerDocument.defaultView || window;
    const style = win.getComputedStyle(el);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      (rect.width > 0 || rect.height > 0 || el.tagName === 'BODY' || el.tagName === 'FORM')
    );
  }

  function waitForDomSettle(quietPeriodMs: number = 300, maxWaitMs: number = 4000): Promise<void> {
    return new Promise((resolve) => {
      let timeoutId: any = null;
      let maxTimeoutId: any = null;
      let observer: MutationObserver | null = null;

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (maxTimeoutId) clearTimeout(maxTimeoutId);
        if (observer) {
          observer.disconnect();
          observer = null;
        }
      };

      const onQuiet = () => {
        cleanup();
        resolve();
      };

      maxTimeoutId = setTimeout(() => {
        cleanup();
        resolve();
      }, maxWaitMs);

      timeoutId = setTimeout(onQuiet, quietPeriodMs);

      try {
        const root = document.documentElement || document.body;
        if (!root) {
          cleanup();
          resolve();
          return;
        }

        observer = new MutationObserver(() => {
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(onQuiet, quietPeriodMs);
        });

        observer.observe(root, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true,
        });
      } catch (obsErr) {
        console.warn('[FlowMacro Replayer] MutationObserver setup error:', obsErr);
        cleanup();
        resolve();
      }
    });
  }

  // ============================================================================
  // COMMAND EXECUTION
  // ============================================================================
  async function executeSeleniumCommand(
    command: SeleniumCommand,
    speed: number = 1,
    timeoutMs: number = 5000
  ): Promise<{ success: boolean; commandId: string; error?: string; navigated?: boolean }> {
    let finalValue = command.value || '';
    let navigated = false;

    // Handle in-memory session secret or JIT Vault decryption for protected passwords
    if (command.isSensitive) {
      if (command.sessionSecret) {
        finalValue = command.sessionSecret;
      } else if (
        command.encryptedSecret &&
        (!finalValue || finalValue.startsWith('{{'))
      ) {
        try {
          finalValue = await decryptSecret(
            command.encryptedSecret.ciphertext,
            command.encryptedSecret.iv
          );
        } catch (e: any) {
          const decErr = `Failed to decrypt protected secret for target "${command.target}": ${e.message || String(e)}`;
          console.error('[FlowMacro Replayer]', decErr);
          throw new Error(decErr);
        }
      }
    }

    if (command.command === 'wait') {
      const waitTime = parseInt(command.target) || 1000;
      await new Promise((r) => setTimeout(r, waitTime / speed));
      return { success: true, commandId: command.id };
    }

    // Locate DOM target using waterfall
    const element = await resolveTargetElement(command.target, command.targets, timeoutMs);

    // Scroll into view & green highlight
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    highlightTarget(element);
    await new Promise((r) => setTimeout(r, Math.max(50, 150 / speed)));

    switch (command.command) {
      case 'click': {
        simulateClick(element);
        // Await DOM settle for SPA client-side routing, animations, and dynamic loads
        await waitForDomSettle(300, 4000);
        break;
      }

      case 'type': {
        simulateType(element, finalValue);
        break;
      }

      case 'select': {
        simulateSelect(element, finalValue);
        break;
      }

      case 'submit': {
        navigated = true;
        simulateSubmit(element);
        await waitForDomSettle(300, 4000);
        break;
      }

      case 'waitFor': {
        // Element was already successfully resolved and visible
        break;
      }

      default:
        throw new Error(`Unsupported command: ${command.command}`);
    }

    return { success: true, commandId: command.id, navigated };
  }

  // ============================================================================
  // SYNTHETIC EVENT SIMULATION (React & Vue compatible)
  // ============================================================================
  function simulateClick(el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const win = el.ownerDocument.defaultView || window;

    const mouseOpts: MouseEventInit = {
      bubbles: true,
      cancelable: true,
      view: win,
      clientX: x,
      clientY: y,
    };

    el.dispatchEvent(new PointerEvent('pointerdown', mouseOpts));
    el.dispatchEvent(new MouseEvent('mousedown', mouseOpts));
    el.focus();
    el.dispatchEvent(new PointerEvent('pointerup', mouseOpts));
    el.dispatchEvent(new MouseEvent('mouseup', mouseOpts));
    el.dispatchEvent(new MouseEvent('click', mouseOpts));

    // Native browser activation for checkboxes, radio buttons, file inputs, and Radix/Headless UI
    try {
      HTMLElement.prototype.click.call(el);
    } catch (clickErr) {
      try {
        if (typeof el.click === 'function') {
          el.click();
        }
      } catch (fallbackClickErr) {
        console.debug('[FlowMacro Replayer] Native element click fallback notice:', fallbackClickErr);
      }
    }
  }

  function simulateType(el: HTMLElement, text: string) {
    el.focus();
    el.dispatchEvent(new Event('focus', { bubbles: true }));
    const win = el.ownerDocument.defaultView || window;

    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      const input = el as HTMLInputElement | HTMLTextAreaElement;

      // React / Vue synthetic event value setter bypass
      const prototype = Object.getPrototypeOf(input);
      const prototypeDescriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
      const descTarget =
        el.tagName === 'TEXTAREA'
          ? (win.HTMLTextAreaElement || HTMLTextAreaElement).prototype
          : (win.HTMLInputElement || HTMLInputElement).prototype;
      const htmlDescriptor = Object.getOwnPropertyDescriptor(descTarget, 'value');
      const setter = prototypeDescriptor?.set || htmlDescriptor?.set;

      if (setter) {
        setter.call(input, text);
      } else {
        input.value = text;
      }

      input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    } else {
      el.innerText = text;
      el.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    }
  }

  function simulateSelect(el: HTMLElement, val: string) {
    if (el.tagName === 'SELECT') {
      const select = el as HTMLSelectElement;
      let targetValue = val;

      if (val.startsWith('label=')) {
        const labelText = val.replace(/^label=/, '');
        for (const opt of Array.from(select.options)) {
          if (opt.text.trim() === labelText.trim()) {
            targetValue = opt.value;
            break;
          }
        }
      } else if (val.startsWith('value=')) {
        targetValue = val.replace(/^value=/, '');
      }

      select.value = targetValue;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  function simulateSubmit(el: HTMLElement) {
    const form = el.tagName === 'FORM' ? (el as HTMLFormElement) : el.closest('form');
    if (form) {
      if (typeof form.requestSubmit === 'function') {
        form.requestSubmit();
      } else {
        form.submit();
      }
    }
  }

  function highlightTarget(el: HTMLElement) {
    const originalOutline = el.style.outline;
    const originalOffset = el.style.outlineOffset;

    el.style.outline = '2px solid #22c55e';
    el.style.outlineOffset = '2px';

    setTimeout(() => {
      el.style.outline = originalOutline;
      el.style.outlineOffset = originalOffset;
    }, 500);
  }
})();
