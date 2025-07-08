# seo-auditor-pro

A Chrome extension that injects custom scripts into web pages based on user configuration.  
Use it to audit, modify, or enhance page content on the fly with minimal setup.

---

## Table of Contents

1. [Project Overview](#project-overview)  
2. [Features](#features)  
3. [Architecture & Flow](#architecture--flow)  
4. [Installation](#installation)  
5. [Usage](#usage)  
6. [Components](#components)  
7. [Dependencies](#dependencies)  
8. [Development & Contributing](#development--contributing)  
9. [License](#license)  

---

## Project Overview

**seo-auditor-pro** lets you:

- Define custom JavaScript snippets or DOM?modification rules.  
- Persist your settings via `chrome.storage.sync`.  
- Inject scripts automatically or on demand via a popup UI.  
- Communicate between popup, background service worker, and content scripts with the Chrome Messaging API.

> **Project Description:**  
> Enter project notes here

---

## Features

- Manifest V3 with minimal required permissions  
- Background service worker (`background.js`) for event?driven tasks  
- Content script (`contentScript.js`) for DOM interaction and script injection  
- Popup UI (`popup.html` / `popup.js`) for one-click actions  
- Options page (`options.html` / `options.js`) for persistent settings  
- `chrome.storage.sync` for saving user preferences  
- Message passing between all components  
- Error handling and logging in the background script  

---

## Architecture & Flow

### Architecture

```
manifest.json
??? background.js        # Service worker (event-driven)
??? contentScript.js     # Injected into matching pages
??? popup.html            # UI for quick commands
??? popup.js              # Handles popup interactions
??? options.html          # UI for persistent settings
??? options.js            # Saves/restores options
??? styles.css            # Shared styling
```

### Message Flow

1. **Installation**  
   - User installs or updates the extension.  
   - Chrome starts the service worker (`background.js`).  

2. **Page Load**  
   - User navigates to a URL matching content script rules.  
   - `contentScript.js` injects and initializes itself.  

3. **Popup Interaction**  
   - User clicks the extension icon ? `popup.html` opens.  
   - `popup.js` reads stored config and renders controls.  
   - On user action, `popup.js` sends a message to `background.js`.  

4. **Background Processing**  
   - `background.js` updates `chrome.storage`, logs events, or relays messages to `contentScript.js`.  

5. **Content Script Action**  
   - `contentScript.js` receives commands, manipulates the DOM or executes custom code, then reports back.  

6. **Options Management**  
   - User opens Options page ? `options.html` / `options.js`.  
   - Settings are saved/restored via `chrome.storage.sync`.  

---

## Installation

1. Clone the repo:  
   ```
   git clone https://github.com/yourusername/seo-auditor-pro.git
   ```

2. Open Chrome and navigate to:  
   ```
   chrome://extensions
   ```

3. Enable **Developer mode** (top right).

4. Click **Load unpacked** and select the project folder.

5. The **seo-auditor-pro** icon should appear in your toolbar.

---

## Usage

1. Navigate to a page matching the patterns in `manifest.json`.  
2. Click the **seo-auditor-pro** icon.  
3. In the popup:
   - Toggle features on/off.  
   - Enter or adjust script snippets.  
   - Click **Apply** to inject immediately.

4. To change global settings, click **Options** in the popup or go to `chrome://extensions` ? **Details** ? **Extension options**.

### Example

```jsonc
// Sample user configuration stored in chrome.storage.sync
{
  "targets": ["https://example.com/*"],
  "scripts": [
    "console.log('SEO Auditor: Page loaded.');",
    "document.querySelectorAll('img').forEach(img => { img.setAttribute('loading', 'lazy'); });"
  ]
}
```

After saving this config in the options page, every `example.com` page will run the two scripts automatically.

---

## Components

- **manifest.json**  
  Defines extension metadata, permissions, and entry points.  

- **background.js**  
  Service worker that handles runtime messages, storage updates, and error logging.  

- **contentScript.js**  
  Injects into web pages, applies configured scripts or DOM changes.  

- **popup.html / popup.js**  
  Provides the lightweight UI for on?the?fly commands and quick script injection.  

- **options.html / options.js**  
  Full settings page for saving and restoring persistent preferences via `chrome.storage.sync`.  

- **styles.css**  
  Shared styles for popup and options pages.  

---

## Dependencies

- Google Chrome (or Chromium?based browser) supporting Manifest V3  
- No external NPM packages  
- Uses the Chrome Extensions APIs:  
  - `chrome.runtime`  
  - `chrome.storage.sync`  
  - `chrome.action` (for the popup)  

---

## Development & Contributing

1. Fork the repo and create your feature branch.  
2. Commit your changes and push to your fork.  
3. Open a pull request with a clear description of your changes.  

Please ensure all new JavaScript code is linted and documented.

---

## License

MIT License  
? 2024 Your Name / Organization