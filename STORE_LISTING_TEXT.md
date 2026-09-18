# Chrome Web Store Listing Copy & Justifications — FlowMacro

This document contains exact, copy-paste-ready text blocks formatted specifically for the Chrome Web Store Developer Dashboard submission form.

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

### Detailed Store Description
```text
FlowMacro is a developer-first browser automation engine and standalone Selenium IDE for Chrome. Record repetitive web tasks, auto-mask sensitive credentials with local AES-256-GCM encryption, replay actions with millisecond precision, and export clean, idiomatic Playwright, Puppeteer, and Python Selenium code in seconds.
```

### Official Links & Web Store URLs
- **Official Website**: `https://flowmacro-app.vercel.app`
- **Privacy Policy URL**: `https://flowmacro-app.vercel.app/privacy`
- **Alternative Mirror**: `https://flowmacro-extension.vercel.app`

⚡ KEY CAPABILITIES

1. Dedicated Standalone IDE Controller (960 × 750px)
Unlike cramped extension popups or devtools tabs that disrupt page styling, FlowMacro operates as a dedicated standalone controller window orchestrating target tabs without DOM or CSS collisions.

2. Zero-Trust Local Credential Vault (AES-256-GCM)
• Automatic Sensitive Field Detection: Automatically identifies password inputs and PIN fields (type="password", autocomplete="current-password").
• Ephemeral In-Memory Shield: Passwords appear as {{SECRET_PASSWORD}} in the IDE table and are encrypted client-side using the W3C Web Crypto API.
• Zero Plain-Text Leaks: Exported scripts strictly reference environment variables (process.env.AUTO_MACRO_PASSWORD / os.getenv('AUTO_MACRO_PASSWORD')) so secrets never leak into Git repositories or CI/CD logs.

3. Deterministic In-Browser Macro Replay
• Sequential event runner with visual element highlighting.
• Native prototype descriptor injection for React, Vue, and Angular virtual DOM compatibility.
• Page lifecycle synchronization (chrome.tabs.onUpdated) to automatically wait for page redirects and asynchronous reloads.

4. 1-Click Multi-Framework Code Exporters
• Playwright (TypeScript & JavaScript)
• Puppeteer (Node.js)
• Python Selenium (WebDriver)
• Selenium IDE (.side JSON project files)

5. CSV Batch Execution Engine
Bind spreadsheet columns (e.g., {{email}}, {{first_name}}, {{sku}}) to automate multi-row form submissions and repetitive data workflows.

6. 100% Air-Gapped & Zero-Backend
• No account creation, no external telemetry, and no remote databases.
• All macro sequences, selectors, and test configurations live exclusively in local browser storage (chrome.storage.local).
```

---

## 2. Single Purpose Description

```text
FlowMacro allows users to record, edit, and replay automated browser workflows, manage local password masking, and export scripts to Playwright, Puppeteer, and Python Selenium formats.
```

---

## 3. Permission Justifications (For Developer Dashboard)

Copy each entry into the corresponding **Permission Justification** field:

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
Required to render the macro editor and execution control dashboard when open in side panel mode.
```

### `storage`
```text
Required to save macro command sequences, Base URLs, and step configurations locally in chrome.storage.local.
```

### `tabs`
```text
Required to detect page navigations (chrome.tabs.onUpdated) during multi-step macro replay and synchronize target window execution.
```

### `unlimitedStorage`
```text
Required to persist local test logs and large macro suites without exceeding browser quota limits.
```

### `host_permissions` (`<all_urls>`)
```text
Required to execute automated macro replay across user-specified target domains.
```

---

## 4. Privacy & Data Disclosures

### Data Collection Declarations (Developer Console Checklist):

| Category | Collected? | Stored on Server? | Justification / Description |
| :--- | :---: | :---: | :--- |
| **User Activity** | **YES** | **NO (100% Local)** | Captures click events and mouse coordinates strictly during active macro recording. Never sent to remote servers. |
| **Website Content** | **YES** | **NO (100% Local)** | Captures form input selectors and DOM text elements strictly during active recording. Stored strictly in local `chrome.storage.local`. |
| **Personally Identifiable Info (PII)** | **NO** | **NO** | No personal identity or profile information is collected. |
| **Financial / Payment Data** | **NO** | **NO** | Processed entirely through external third-party payment provider (Dodo Payments) on their hosted checkout page. |
| **Authentication Info / Credentials** | **YES (Masked)** | **NO (100% Local)** | Passwords entered into target forms are intercepted, masked as `{{SECRET_PASSWORD}}`, and encrypted in RAM using native Web Crypto AES-256-GCM. Never transmitted or stored in plain text. |

### Privacy Certifications:
- [x] **Single Purpose Certification:** I certify that FlowMacro serves a single, clear purpose: recording and replaying browser automations and exporting test scripts.
- [x] **Data Use Certification:** I certify that user data is not sold to third parties, used for unrelated purposes, or used for creditworthiness/lending.

---

## 5. Reviewer Notes / Testing Instructions (For Google Review Team)

```text
To test FlowMacro:
1. Click the FlowMacro icon in the toolbar. A standalone 960x750px IDE controller window opens.
2. In the Base URL field, enter any URL (e.g., https://example.com or any public website) and click "Open Base URL".
3. Click the [⏺ Record] button. Interact with the target window by clicking links, typing text, or filling forms. Notice actions populate in the command table in real time.
4. If a password field is typed into, notice that FlowMacro auto-masks the value as {{SECRET_PASSWORD}} and encrypts it locally.
5. Click [⏹ Stop], then click [▶ Play] to replay the sequence in the target tab.
6. Click [Export] to generate clean Playwright, Puppeteer, Python Selenium, or .side automation scripts.

No remote account or authentication is required to test the full functionality. Everything runs locally and offline.
```
