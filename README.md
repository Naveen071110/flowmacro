<div align="center">

# FlowMacro — Zero-Trust Web Automation & Selenium IDE

<p align="center">
  <strong>Record robust multi-page browser workflows, securely mask credentials with local AES-256-GCM encryption, replay macros across target tabs, and export clean Playwright, Puppeteer & Selenium code.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Chrome_Web_Store-v1.0.1-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Chrome Web Store" />
  <img src="https://img.shields.io/badge/Manifest-V3-0052CC?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Playwright-Supported-2EAD33?style=for-the-badge&logo=playwright&logoColor=white" alt="Playwright" />
  <img src="https://img.shields.io/badge/Selenium-Compatible-43B02A?style=for-the-badge&logo=selenium&logoColor=white" alt="Selenium" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-10B981?style=for-the-badge" alt="MIT License" /></a>
</p>

<sub>Built by <a href="https://github.com/Naveen071110">Naveen Guru</a> • The local-first, privacy-respecting alternative to legacy Selenium IDE.</sub>

</div>

---

## ⚡ The Problem & The Solution

| Legacy Macro Recorders & Side-Panels | FlowMacro (Controller + Target Architecture) |
| :--- | :--- |
| **Drops execution context on full-page navigations, OAuth redirects, and domain hops.** Side panels unmount or reload with the tab. | **Dedicated Controller Window (`ide.html`)**. Stays permanently mounted while driving an independent managed target tab via the Chrome Extension Service Worker. |
| **Fragile single selectors (e.g. dynamic Tailwind classes)** that break whenever a site updates its CSS. | **5-Tier Resilient Waterfall**. Captures and ranks `data-testid` → ID → Semantic ARIA → Robust CSS → Relative XPath with live re-identification fallback. |
| **Plaintext passwords stored in unencrypted JSON scripts**, risking exposure in shared repos and exports. | **Zero-Knowledge Web Crypto Vault**. Passwords and sensitive inputs are encrypted locally using **AES-256-GCM** (PBKDF2 100,000 iterations). |
| **Trapped in proprietary automation formats** or bloated, unmaintainable `.side` XML blobs. | **One-click multi-format exporters**: Generates modern async/await **Playwright (TypeScript/JavaScript)**, **Puppeteer**, and **Python Selenium**. |

---

## ✨ Key Features

- **🪟 Standalone Controller Window (`ide.html`) + Managed Target Tab**: Run, pause, step-through, and debug macros without the recording UI interfering with the inspected webpage layout.
- **🛡️ 5-Tier Selector Waterfall**:
  1. `[data-testid]` / `[data-cy]` / `[data-qa]` (Testing IDs)
  2. `#id` (Stable DOM IDs)
  3. `aria-label` / `role` (Accessibility attributes)
  4. Hierarchical CSS selector paths
  5. Fallback relative XPath
- **🔐 Local AES-256-GCM Password Vault**: Mask and encrypt passwords with your master passphrase directly in Chrome via the native Web Crypto API. Replays inject credentials into memory without saving plaintext to storage.
- **⚡ Multi-Format Code Generation**:
  - **Playwright (TypeScript / JavaScript)**: Clean, idiomatic `page.locator().click()` syntax.
  - **Puppeteer**: Modern async script ready for Node.js crawlers.
  - **Python Selenium**: Standard `WebDriverWait` and `By.XPATH` code blocks.
  - **Selenium IDE (`.side` format)**: Full backward compatibility for enterprise QA suites.
- **📊 CSV Batch Parameter Execution**: Parameterize input fields and run automated repetitive data entry workflows across hundreds of rows directly in the browser.

---

## 🛠️ Architecture & Tech Stack

```
web-macro-automation/
├── src/
│   ├── background/         # Service worker, tab lifecycle controller & event routing
│   ├── content_scripts/    # Low-footprint DOM observer, mutation watcher & recorder HUD
│   ├── ide/                # Standalone Controller IDE Window (React 18 + Tailwind)
│   ├── sidepanel/          # Lightweight quick-access side panel launcher
│   └── shared/             # AES-256-GCM crypto vault, code generators & storage adapters
├── public/                 # Manifest V3 configuration & assets
└── scripts/                # Multi-target build and packaging scripts
```

| Layer | Technologies Used | Purpose |
| :--- | :--- | :--- |
| **Browser Runtime** | Chrome Manifest V3, Service Workers, Scripting API | Inter-tab communication, dynamic content script injection & tab management. |
| **IDE Controller** | React 18, TypeScript, Tailwind CSS, Lucide Icons | Visual step reordering, real-time log inspector, variable editor & runner. |
| **Cryptography** | Web Crypto API (SubtleCrypto), AES-256-GCM, PBKDF2 | Zero-knowledge client-side encryption of user credentials and sensitive parameters. |
| **Code Exporters** | Custom AST template engines | Generates clean Playwright (TS/JS), Puppeteer, and Python Selenium scripts. |
| **Data Engine** | Chrome Storage API (`local` & `sync`), CSV Parser | High-speed batch executions, macro catalog persistence & parameter injection. |

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18.0 or higher
- Google Chrome (or any Chromium-based browser)

### 1. Clone the repository
```bash
git clone https://github.com/Naveen071110/flowmacro.git
cd flowmacro
```

### 2. Install dependencies & build extension
```bash
npm install
npm run build
```
This compiles the background worker, content script, standalone IDE, and side panel into the `dist/` directory.

### 3. Load the extension in Chrome
1. Open Google Chrome and go to `chrome://extensions/`.
2. Toggle on **Developer mode** in the top-right corner.
3. Click **Load unpacked** and select the `dist/` folder inside `web-macro-automation`.
4. Click the **FlowMacro** icon to launch the standalone Controller IDE window.

---

## 📦 Packaging for Chrome Web Store

To build and package a release `.zip` archive:
```bash
npm run package
```
The output file will be generated at `flowmacro-extension.zip`.

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">
  <sub>Crafted with ❤️ by <a href="https://github.com/Naveen071110">Naveen Guru</a> • Follow on <a href="https://x.com">X / Twitter</a></sub>
</div>
