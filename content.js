(async () => {
  try {
    const config = await fetchUserConfig();
    const { scriptCode, changes } = config || {};
    let scriptResult = null;

    if (scriptCode && typeof scriptCode === 'string') {
      scriptResult = executeCustomScript(scriptCode);
    }

    if (Array.isArray(changes)) {
      modifyDOM(changes);
    }

    sendResultToBackground({ success: true, result: scriptResult });
  } catch (error) {
    sendResultToBackground({ success: false, error: error.message });
  }
})();

function fetchUserConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ userConfig: {} }, (items) => {
      resolve(items.userConfig);
    });
  });
}

function executeCustomScript(code) {
  // Basic validation to prevent dangerous operations
  const forbiddenPatterns = [
    /(?:window|document|eval|Function|constructor|import|export|require|while|for|\bthis\b)/i,
    /<\/?script>/i
  ];
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(code)) {
      throw new Error('Custom script contains forbidden patterns');
    }
  }

  try {
    const func = new Function('"use strict";\n' + code);
    return func();
  } catch (error) {
    console.error('executeCustomScript error:', error);
    throw error;
  }
}

function sanitizeHTML(input) {
  const template = document.createElement('template');
  template.textContent = input;
  return template.innerHTML;
}

function modifyDOM(changes) {
  changes.forEach((change) => {
    try {
      const elements = document.querySelectorAll(change.selector);
      if (!elements.length) return;
      elements.forEach((el) => {
        switch (change.action) {
          case 'text':
            el.textContent = change.content || '';
            break;
          case 'html':
            if (typeof change.content === 'string') {
              el.innerHTML = sanitizeHTML(change.content);
            }
            break;
          case 'attribute':
            if (change.attribute) {
              if (change.value === null) {
                el.removeAttribute(change.attribute);
              } else {
                el.setAttribute(change.attribute, change.value);
              }
            }
            break;
          case 'style':
            if (typeof change.styles === 'object') {
              Object.entries(change.styles).forEach(
                ([prop, val]) => (el.style[prop] = val)
              );
            }
            break;
          case 'remove':
            el.remove();
            break;
          default:
            console.warn('Unknown DOM action:', change.action);
        }
      });
    } catch (error) {
      console.error('modifyDOM change error:', change, error);
    }
  });
}

function sendResultToBackground(message) {
  chrome.runtime.sendMessage(
    { type: 'executionResult', payload: message },
    () => {
      if (chrome.runtime.lastError) {
        console.error('sendResultToBackground error:', chrome.runtime.lastError);
      }
    }
  );
}