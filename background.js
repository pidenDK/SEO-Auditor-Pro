importScripts('src/dataforseo/api.js');

function initServiceWorker() {
  logInfo('Service worker initializing');
  chrome.runtime.onMessage.addListener(handleRuntimeMessage);
  chrome.runtime.onInstalled.addListener(details => {
    logInfo(`Extension installed: ${details.reason}`);
  });
  chrome.runtime.onStartup.addListener(() => {
    logInfo('Chrome startup event');
  });
}

function handleRuntimeMessage(request, sender, sendResponse) {
  (async () => {
    try {
      const { action, key, value, tabId, message } = request;
      const KEY_PATTERN = /^[a-zA-Z0-9_-]+$/;
      let result;
      switch (action) {
        case 'updateStorage':
        case 'updateEnabled':
        case 'updateScripts':
        case 'toggleScript':
          if (typeof key !== 'string' || !key || !KEY_PATTERN.test(key)) {
            throw new Error('Invalid storage key');
          }
          await updateStorage(key, value);
          result = { success: true };
          break;
        case 'getFromStorage':
          if (typeof key !== 'string' || !key || !KEY_PATTERN.test(key)) {
            throw new Error('Invalid storage key');
          }
          const data = await getFromStorage(key);
          result = { data };
          break;
        case 'relayMessage':
          if (typeof tabId !== 'number' || !message) {
            throw new Error('Invalid relay parameters');
          }
          const response = await relayMessageToContent(tabId, message);
          result = { success: true, response };
          break;
        case 'resetSettings':
          await new Promise(resolve => chrome.storage.sync.clear(resolve));
          logInfo('Storage cleared');
          result = { success: true };
          break;
          case 'analyzeOnPage':
          if (!value || !value.url) {
            throw new Error('Missing URL for on-page analysis');
          }
          result = await dfsApi.analyzeOnPage(value.url);
          break;
        case 'getPerformanceMetrics':
          if (!value || !value.url) {
            throw new Error('Missing URL for performance metrics');
          }
          result = await dfsApi.getPerformanceMetrics(value.url);
          break;
        case 'fetchKeywords':
          result = await dfsApi.fetchKeywords(value);
          break;
        case 'getBacklinks':
          if (!value || !value.domain) {
            throw new Error('Missing domain for backlink lookup');
          }
          result = await dfsApi.getBacklinks(value.domain);
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }
      sendResponse({ success: true, payload: result });
    } catch (err) {
      logError(err);
      sendResponse({ success: false, error: err.message });
    }
  })();
  return true;
}

function updateStorage(key, value) {
  return new Promise((resolve, reject) => {
    const items = {};
    items[key] = value;
    chrome.storage.sync.set(items, () => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(err);
      } else {
        logInfo(`Storage updated: ${key}`);
        resolve();
      }
    });
  });
}

function getFromStorage(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get([key], items => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(err);
      } else {
        resolve(items[key]);
      }
    });
  });
}

function relayMessageToContent(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, response => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(err);
      } else {
        logInfo(`Relayed message to tab ${tabId}`);
        resolve(response);
      }
    });
  });
}

function logError(error) {
  console.error(`[Background Error] ${error.stack || error}`);
}

function logInfo(message) {
  console.log(`[Background Info] ${message}`);
}

initServiceWorker();
