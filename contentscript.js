let currentConfig = {
  enabled: false,
  scripts: []
};

// Example: load stored config into currentConfig on startup
chrome.storage.sync.get(['enabled', 'scripts'], items => {
  if (items.enabled !== undefined) currentConfig.enabled = items.enabled;
  if (Array.isArray(items.scripts)) currentConfig.scripts = items.scripts;
});

// Handle runtime messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) return;

  // New handler for getConfig
  if (message.type === 'getConfig') {
    // Return the in-memory config
    sendResponse(currentConfig);
    return true; // keep the messaging channel open if needed
  }

  // --- existing handlers, e.g. ---
  // if (message.type === 'updateEnabled') { ... }
  // else if (message.type === 'updateScripts') { ... }
  // else if (message.type === 'resetSettings') { ... }
  // else {
  //   console.error(`Unknown action: ${message.type}`);
  // }
});