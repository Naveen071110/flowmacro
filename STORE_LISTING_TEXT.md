# Chrome Web Store Listing Copy & Developer Console Submission Guide — FlowMacro v1.0.2

This document contains exact, copy-paste-ready text blocks formatted specifically for the **Chrome Web Store Developer Dashboard** submission form.

---

## 1. Store Metadata & Summary

### Extension Title (Max 45 characters)
```text
FlowMacro — Web Automation & Selenium IDE
```
*(Alternative full title: `FlowMacro — Web Automation & Selenium IDE Engine`)*

### Short Summary (Max 132 characters)
```text
Record web workflows, mask passwords with local encryption, replay macros, and export clean Playwright or Selenium code.
```
*(Character count: 121 / 132)*

### Detailed Store Description (Copy & Paste directly into Description box)
```text
FlowMacro is a developer-first browser automation engine and standalone Selenium IDE for Google Chrome. Record complex web workflows, auto-mask sensitive credentials with local AES-256-GCM encryption, replay actions with millisecond precision, and export clean, idiomatic Playwright, Puppeteer, and Python Selenium code in seconds.

⚡ KEY CAPABILITIES

1. Dedicated Standalone IDE Controller (960 × 750px)
Unlike cramped extension popups or devtools tabs that disrupt page layout, FlowMacro operates as a dedicated standalone controller window orchestrating target tabs with clean visual isolation.

2. Zero-Trust Local Credential Vault (AES-256-GCM)
• Automatic Sensitive Field Detection: Automatically identifies password inputs and PIN fields (type="password", autocomplete="current-password").
• Ephemeral In-Memory Shield: Passwords appear as {{SECRET_PASSWORD}} in the IDE table and are encrypted client-side in RAM using the W3C Web Crypto API.
• Zero Plain-Text Leaks: Exported scripts reference environment variables (process.env.AUTO_MACRO_PASSWORD / os.getenv('AUTO_MACRO_PASSWORD')) so secrets never leak into Git repositories or CI/CD logs.

3. 5-Tier Selector Waterfall
• Redundant Fallback Locators: Automatically records data-testid → id → aria-label / ARIA → optimal CSS path → robust XPath.
• Self-Healing Resilience: If a page refactor changes class names, FlowMacro falls back down the chain with zero manual intervention.

4. Deep Shadow DOM & Cross-Origin Iframe Routing
• Shadow-Piercing Traversal: Automatically traverses open shadow roots using recursive >>> locators.
• Targeted Frame Dispatch: Dispatches commands directly to specific iframe IDs without throwing cross-origin security exceptions on payment widgets, Stripe, or login iframes.

5. SPA Route Interception & Zero-Drop Buffers
• Intercepts single-page app transitions (pushState, replaceState, popstate, hashchange).
• Immediately flushes pending debounced keystrokes before DOM unmount so no characters are lost during rapid React, Next.js, or Vue transitions.

6. Manifest V3 Service Worker Keep-Alive
• Built-in alarm heartbeats prevent MV3 background worker eviction during long automation delays, countdowns, or waitForElement steps.

7. 1-Click Multi-Framework Code Exporters
• Playwright (TypeScript & JavaScript)
• Puppeteer (Node.js)
• Python Selenium (WebDriver)
• Selenium IDE (.side JSON project files)

8. 100% Client-Side Local Execution
• No account creation, no external telemetry, and no remote cloud servers.
• All macro sequences, selectors, and configurations live exclusively in local browser storage (chrome.storage.local and chrome.storage.session).
```

### Official Links
- **Official Website**: `https://flowmacro.vercel.app`
- **Privacy Policy URL**: `https://flowmacro.vercel.app/privacy`
- **GitHub Repository**: `https://github.com/Naveen071110/flowmacro`

---

## 2. What's New in Version 1.0.2 (Release Notes)

Copy and paste this into the **Version Release Notes** field:
```text
Version 1.0.2 Release Notes:
- Deep Shadow DOM Piercing: Added recursive traversal (>>>) across open shadow roots for Web Components and custom elements.
- Cross-Origin Iframe Routing: Implemented frameId-targeted execution for embedded payment, Stripe, and authentication iframes.
- SPA Route Interception: Wrapped history pushState/replaceState to immediately flush pending inputs during rapid single-page app navigations.
- MV3 Keep-Alive Alarms: Scheduled service worker keep-alive pings during long pauses and element waits to prevent background eviction.
- Exporter Engine: Enhanced Playwright, Puppeteer, and Selenium generators with robust fallback selectors.
```

---

## 3. Single Purpose Description

```text
FlowMacro allows users to record, edit, and replay automated browser workflows, manage local password masking, and export scripts to Playwright, Puppeteer, and Python Selenium formats.
```

---

## 4. Permission Justifications (For Developer Dashboard)

Copy each entry into the corresponding **Permission Justification** field in the Chrome Web Store Developer Console:

### `activeTab`
```text
Required to capture DOM click, type, and selection events in the active target tab during recording and replay sessions.
```

### `scripting`
```text
Required to programmatically inject the recorder and replayer event listeners into the managed target window.
```

### `sidePanel`
```text
Required to render the macro editor and execution control dashboard when open in Chrome side panel mode.
```

### `storage`
```text
Required to save macro command sequences, Base URLs, and step configurations locally in chrome.storage.local and session storage.
```

### `tabs`
```text
Required to detect page navigations (chrome.tabs.onUpdated) during multi-step macro replay and synchronize target window execution.
```

### `unlimitedStorage`
```text
Required to persist local test logs and large macro suites without exceeding browser quota limits.
```

### `webNavigation`
```text
Required to listen to web navigation lifecycles (onCompleted) to re-attach recording listeners across multi-page redirects and full-page reloads.
```

### `alarms`
```text
Required to schedule periodic keep-alive alarms that prevent Manifest V3 background service worker termination during long automation replays and delay steps.
```

### `host_permissions` (`<all_urls>`)
```text
Required to execute automated macro replay across user-specified target domains.
```

---

## 5. Privacy & Data Disclosures Checklist

In the **Privacy practices** tab of the Developer Console:

| Category | Collected? | Stored on Server? | Justification / Description |
| :--- | :---: | :---: | :--- |
| **User Activity** | **YES** | **NO (100% Local)** | Captures click events and mouse coordinates strictly during active macro recording. Never sent to remote servers. |
| **Website Content** | **YES** | **NO (100% Local)** | Captures form input selectors and DOM text elements strictly during active recording. Stored strictly in local `chrome.storage.local`. |
| **Personally Identifiable Info (PII)** | **NO** | **NO** | No personal identity or profile information is collected. |
| **Financial / Payment Data** | **NO** | **NO** | Zero financial data collected or processed by the extension. |
| **Authentication Info / Credentials** | **YES (Masked)** | **NO (100% Local)** | Passwords entered into target forms are intercepted, masked as `{{SECRET_PASSWORD}}`, and encrypted in RAM using native Web Crypto AES-256-GCM. Never transmitted or stored in plain text. |

### Privacy Certifications:
- [x] **Single Purpose Certification:** I certify that FlowMacro serves a single, clear purpose: recording and replaying browser automations and exporting test scripts.
- [x] **Data Use Certification:** I certify that user data is not sold to third parties, used for unrelated purposes, or used for creditworthiness/lending.

---

## 6. Reviewer Notes / Testing Instructions (For Google Review Team)

```text
To test FlowMacro v1.0.3:
1. Click the FlowMacro icon in the toolbar. A standalone 960x750px IDE controller window opens.
2. In the Base URL field, enter any URL (e.g., https://example.com or any public website) and click "Open Base URL".
3. Click the [⏺ Record] button. Interact with the target window by clicking links, typing text, or filling forms. Notice actions populate in the command table in real time with 5-tier selector resolution.
4. If a password field is typed into, notice that FlowMacro auto-masks the value as {{SECRET_PASSWORD}} and encrypts it locally via AES-256-GCM.
5. Click [⏹ Stop], then click [▶ Play] to replay the sequence in the target tab.
6. Click [Export] to generate clean Playwright, Puppeteer, Python Selenium, or .side automation scripts.

No remote account or authentication is required to test the full functionality. Everything runs 100% locally and offline.
```
