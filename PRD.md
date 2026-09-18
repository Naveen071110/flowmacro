# Product Requirement Document (PRD) — AutoMacro

## 1. Vision & Purpose
AutoMacro is a lightweight, zero-backend Chrome extension that allows users to record repetitive browser tasks (form fills, navigation, clicks, data entry) and replay them directly in the browser or export them as Playwright, Puppeteer, or Python Selenium scripts.

## 2. Core Modules
- `content_scripts/recorder.js`: Listens for clicks, input keypresses, select changes, and form submissions. Uses a selector waterfall (`data-testid` -> `id` -> `aria` -> `xpath`).
- `content_scripts/replayer.js`: Receives step queues from the background script, finds DOM targets, simulates native events, and handles retries/wait conditions.
- `background/service_worker.js`: Manages macro execution state, timing delays, and `chrome.storage.local` persistence.
- `sidepanel/`: React + Tailwind dashboard to record, edit step parameters, assign variable placeholders (`{{variable_name}}`), run batch CSV executions, and export automation scripts.

## 3. Step Schema (`chrome.storage.local`)
```json
{
  "macroId": "macro_001",
  "title": "Bulk Lead Form Submission",
  "steps": [
    {
      "id": "step_1",
      "action": "click",
      "selector": "button#login",
      "waitAfterMs": 500
    },
    {
      "id": "step_2",
      "action": "type",
      "selector": "input#email",
      "value": "{{email}}",
      "waitAfterMs": 200
    }
  ]
}
```

## 4. Key Export Targets
- Playwright (TypeScript/JavaScript)
- Puppeteer (Node.js)
- Python (Selenium Webdriver)
- Native AutoMacro JSON Schema

## 5. Architectural Specifications

### 5.1 Selector Waterfall Strategy
When recording user actions on a DOM element, the recorder generates multiple fallback selectors in priority order:
1. **`data-testid` / `data-test` / `data-cy` / `data-qa`**: Most resilient to UI layout and styling changes.
2. **Standard ID (`#element-id`)**: If unique in document and doesn't match auto-generated patterns (e.g. `:r1:`, `mui-12345`).
3. **Semantic Attributes (`[aria-label]`, `[name]`, `[role]`, `[placeholder]`)**: Highly resilient for standard forms and accessibility trees.
4. **Optimized CSS Path**: Breadcrumb CSS selector with meaningful parent classes.
5. **XPath**: Robust text-based or hierarchical fallback (`//button[contains(text(), 'Submit')]`).

### 5.2 Dynamic Variable Substitution (`{{variable}}`)
- Input values support mustache syntax: `{{variable_name}}`.
- Single-Run Mode: Users can supply default values or override variables prior to replay.
- Batch CSV Mode: Users can upload a CSV table where each column maps to a `{{variable_name}}`. The replayer will execute the entire macro sequentially for each row with configurable inter-iteration delays.

### 5.3 Resilient DOM Replay Engine
- **Element Resolution**: Tries the primary selector; if element is missing or not visible within a timeout, attempts fallback selectors from the recorded waterfall.
- **Smart Polling**: Polls the DOM using `requestAnimationFrame` with exponential backoff up to `timeoutMs` (default 5000ms).
- **Native Event Simulation**:
  - Automatically scrolls element into viewport (`element.scrollIntoView({ behavior: 'smooth', block: 'center' })`).
  - Simulates mouse lifecycle: `pointerdown` -> `mousedown` -> `focus` -> `click` -> `mouseup`.
  - For input fields, utilizes JavaScript property descriptor setter bypass to properly trigger React, Vue, and Angular synthetic event listeners.
- **Form Submission**: Triggers `submit` event or simulates Enter keypress if detected during recording.

### 5.4 Zero-Backend Guarantee
- 100% of macro definitions, execution histories, and batch records reside inside `chrome.storage.local`.
- No tracking pixels, external telemetry, or remote dependencies.

## 6. Security & Credential Vault Specification

### 6.1 Mandatory Auto-Masking of Sensitive Fields
- Any input element with `type="password"`, `autocomplete="*-password"`, or sensitive semantic identifiers (`secret`, `apikey`, `token`, `pin`) is automatically marked as `isSensitive: true`.
- Raw plain-text password keystrokes are **never** stored in the step's `value` field.
- The step's `value` is substituted with an auto-generated variable placeholder (e.g. `{{AUTO_MACRO_PASSWORD}}` or `{{SECRET_FIELD_1}}`).
- Action logs and step descriptions automatically redact credentials to `[PROTECTED_SECRET]`.

### 6.2 Client-Side AES-256-GCM Vault Encryption
- Sensitive values are encrypted on-the-fly using the native Web Crypto API (`crypto.subtle`) with AES-GCM 256-bit encryption.
- An isolated extension vault key is generated on the client device and stored strictly within `chrome.storage.local`.
- Decryption happens exclusively just-in-time inside the content script replayer during active automation runs directly into the target DOM element.
- Stored payloads contain only `{ ciphertext, iv }` representations; plain-text credentials are never kept in memory.

### 6.3 Secure Code Generation & Export Redaction
- **Playwright / Puppeteer**: Code exporters automatically substitute sensitive inputs with secure environment variables (`process.env.AUTO_MACRO_PASSWORD || ''`).
- **Python Selenium**: Code exporters emit `os.getenv("AUTO_MACRO_PASSWORD", "")` to comply with enterprise secret management standards.
- **Exported JSON / CSV**: Exported templates automatically redact sensitive secrets as `[ENCRYPTED_SECRET]` or masked placeholders (`••••••••`) to guarantee zero credential leakage when sharing macros.

