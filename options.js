function getEl(id) {
  const el = document.getElementById(id);
  if (!el) {
    console.warn(`Element with id '${id}' not found.`);
  }
  return el;
}

function initOptions() {
  bindOptionEvents();
  restoreOptions();
}

async function restoreOptions() {
  const defaults = {
    injectionEnabled: true,
    injectionDelay: 0,
    customScripts: '',
    dfsApiKey: '',
    dfsApiSecret: '',
    orApiKey: '',
    featOnPage: false,
    featPerformance: false,
    featKeywords: false,
    featBacklinks: false,
    featAi: false,
    cacheTtl: 0
  };
  try {
    const items = await chrome.storage.sync.get(defaults);

    const injectionEnabledEl = getEl('injectionEnabled');
    if (injectionEnabledEl instanceof HTMLInputElement) {
      injectionEnabledEl.checked = Boolean(items.injectionEnabled);
    }

    const injectionDelayEl = getEl('injectionDelay');
    if (injectionDelayEl instanceof HTMLInputElement) {
      injectionDelayEl.value = items.injectionDelay;
    }

    const customScriptsEl = getEl('customScripts');
    if (customScriptsEl instanceof HTMLTextAreaElement || customScriptsEl instanceof HTMLInputElement) {
      customScriptsEl.value = items.customScripts;
    }

    const dfsApiKeyEl = getEl('dfsApiKey');
    if (dfsApiKeyEl instanceof HTMLInputElement) {
      dfsApiKeyEl.value = items.dfsApiKey;
    }

    const dfsApiSecretEl = getEl('dfsApiSecret');
    if (dfsApiSecretEl instanceof HTMLInputElement) {
      dfsApiSecretEl.value = items.dfsApiSecret;
    }

    const orApiKeyEl = getEl('orApiKey');
    if (orApiKeyEl instanceof HTMLInputElement) {
      orApiKeyEl.value = items.orApiKey;
    }

    const featOnPageEl = getEl('featOnPage');
    if (featOnPageEl instanceof HTMLInputElement) {
      featOnPageEl.checked = Boolean(items.featOnPage);
    }

    const featPerformanceEl = getEl('featPerformance');
    if (featPerformanceEl instanceof HTMLInputElement) {
      featPerformanceEl.checked = Boolean(items.featPerformance);
    }

    const featKeywordsEl = getEl('featKeywords');
    if (featKeywordsEl instanceof HTMLInputElement) {
      featKeywordsEl.checked = Boolean(items.featKeywords);
    }

    const featBacklinksEl = getEl('featBacklinks');
    if (featBacklinksEl instanceof HTMLInputElement) {
      featBacklinksEl.checked = Boolean(items.featBacklinks);
    }

    const featAiEl = getEl('featAi');
    if (featAiEl instanceof HTMLInputElement) {
      featAiEl.checked = Boolean(items.featAi);
    }

    const cacheTtlEl = getEl('cacheTtl');
    if (cacheTtlEl instanceof HTMLInputElement) {
      cacheTtlEl.value = items.cacheTtl;
    }

  } catch (error) {
    console.error('Error restoring options:', error);
    showStatusMessage('Error restoring options.', true);
  }
}

function bindOptionEvents() {
  const form = getEl('optionsForm');
  if (form instanceof HTMLFormElement) {
    form.addEventListener('submit', saveOptions);
  }
  const resetBtn = getEl('resetBtn');
  if (resetBtn instanceof HTMLElement) {
    resetBtn.addEventListener('click', resetOptions);
  }
}

async function saveOptions(event) {
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }

  const injectionEnabledEl = getEl('injectionEnabled');
  const delayEl = getEl('injectionDelay');
  const customScriptsEl = getEl('customScripts');
  const dfsApiKeyEl = getEl('dfsApiKey');
  const dfsApiSecretEl = getEl('dfsApiSecret');
  const orApiKeyEl = getEl('orApiKey');
  const featOnPageEl = getEl('featOnPage');
  const featPerformanceEl = getEl('featPerformance');
  const featKeywordsEl = getEl('featKeywords');
  const featBacklinksEl = getEl('featBacklinks');
  const featAiEl = getEl('featAi');
  const cacheTtlEl = getEl('cacheTtl');

  if (!(injectionEnabledEl instanceof HTMLInputElement &&
        delayEl instanceof HTMLInputElement &&
        (customScriptsEl instanceof HTMLTextAreaElement || customScriptsEl instanceof HTMLInputElement) &&
        dfsApiKeyEl instanceof HTMLInputElement &&
        dfsApiSecretEl instanceof HTMLInputElement &&
        orApiKeyEl instanceof HTMLInputElement &&
        featOnPageEl instanceof HTMLInputElement &&
        featPerformanceEl instanceof HTMLInputElement &&
        featKeywordsEl instanceof HTMLInputElement &&
        featBacklinksEl instanceof HTMLInputElement &&
        featAiEl instanceof HTMLInputElement &&
        cacheTtlEl instanceof HTMLInputElement)) {
    showStatusMessage('Missing form elements. Cannot save options.', true);
    return;
  }

  const injectionEnabled = injectionEnabledEl.checked;
  const delayInput = delayEl.value;
  const injectionDelay = Number(delayInput);
  if (isNaN(injectionDelay) || injectionDelay < 0) {
    showStatusMessage('Injection delay must be a non-negative number.', true);
    return;
  }

  const customScripts = customScriptsEl.value.trim();
  const dfsApiKey = dfsApiKeyEl.value.trim();
  const dfsApiSecret = dfsApiSecretEl.value.trim();
  const orApiKey = orApiKeyEl.value.trim();
  const featOnPage = featOnPageEl.checked;
  const featPerformance = featPerformanceEl.checked;
  const featKeywords = featKeywordsEl.checked;
  const featBacklinks = featBacklinksEl.checked;
  const featAi = featAiEl.checked;

  const cacheTtlValue = Number(cacheTtlEl.value);
  if (isNaN(cacheTtlValue) || cacheTtlValue < 0) {
    showStatusMessage('Cache TTL must be a non-negative number.', true);
    return;
  }

  const settings = {
    injectionEnabled,
    injectionDelay,
    customScripts,
    dfsApiKey,
    dfsApiSecret,
    orApiKey,
    featOnPage,
    featPerformance,
    featKeywords,
    featBacklinks,
    featAi,
    cacheTtl: cacheTtlValue
  };

  try {
    await chrome.storage.sync.set(settings);
    showStatusMessage('Options saved successfully.');
  } catch (error) {
    console.error('Error saving options:', error);
    showStatusMessage('Failed to save options.', true);
  }
}

async function resetOptions(event) {
  if (event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }
  const defaults = {
    injectionEnabled: true,
    injectionDelay: 0,
    customScripts: '',
    dfsApiKey: '',
    dfsApiSecret: '',
    orApiKey: '',
    featOnPage: false,
    featPerformance: false,
    featKeywords: false,
    featBacklinks: false,
    featAi: false,
    cacheTtl: 0
  };
  try {
    await chrome.storage.sync.set(defaults);
    restoreOptions();
    showStatusMessage('Options reset to defaults.');
  } catch (error) {
    console.error('Error resetting options:', error);
    showStatusMessage('Failed to reset options.', true);
  }
}

function showStatusMessage(message, isError = false) {
  const statusEl = getEl('status');
  if (!(statusEl instanceof HTMLElement)) {
    return;
  }
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#c00' : '#080';
  statusEl.style.visibility = 'visible';
  setTimeout(() => {
    statusEl.style.visibility = 'hidden';
  }, 3000);
}

document.addEventListener('DOMContentLoaded', initOptions);
})();