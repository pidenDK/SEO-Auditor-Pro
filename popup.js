const defaultSettings = { scripts: [] };

function sanitizeId(id) {
  return 'script-' + String(id).replace(/[^A-Za-z0-9\-_:.]/g, '-');
}

async function fetchSettings() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get({ scripts: defaultSettings.scripts }, result => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve({ scripts: result.scripts });
      }
    });
  });
}

function renderUI(settings) {
  const listContainer = document.getElementById('scriptList');
  listContainer.innerHTML = '';
  settings.scripts.forEach(script => {
    const item = document.createElement('div');
    item.className = 'script-item';
    item.id = `script-item-${sanitizeId(script.id)}`;

    const title = document.createElement('span');
    title.className = 'script-title';
    title.textContent = script.name;
    item.appendChild(title);

    const toggle = document.createElement('button');
    toggle.className = 'btn-toggle';
    toggle.textContent = script.enabled ? 'Disable' : 'Enable';
    toggle.dataset.action = 'toggle';
    toggle.dataset.id = script.id;
    toggle.dataset.enabled = script.enabled;
    item.appendChild(toggle);

    const edit = document.createElement('button');
    edit.className = 'btn-edit';
    edit.textContent = 'Edit';
    edit.dataset.action = 'edit';
    edit.dataset.id = script.id;
    item.appendChild(edit);

    const del = document.createElement('button');
    del.className = 'btn-delete';
    del.textContent = 'Delete';
    del.dataset.action = 'delete';
    del.dataset.id = script.id;
    item.appendChild(del);

    listContainer.appendChild(item);
  });
}

function handleResponse(response) {
  if (chrome.runtime.lastError) {
    alert(`Operation failed: ${chrome.runtime.lastError.message}`);
    return;
  }
  if (response && response.success) {
    fetchSettings()
      .then(renderUI)
      .catch(err => alert(`Failed to load settings: ${err.message}`));
  } else {
    const msg = response && response.error ? response.error : 'Unknown error';
    alert(`Operation failed: ${msg}`);
  }
}

function sendCommand(command, data) {
  chrome.runtime.sendMessage({ command, data }, handleResponse);
}

function onActionClick(event) {
  const btn = event.target.closest('button');
  if (!btn || !btn.dataset.action) return;
  const action = btn.dataset.action;
  const rawId = btn.dataset.id;
  const id = !isNaN(parseInt(rawId, 10)) ? parseInt(rawId, 10) : rawId;

  switch (action) {
    case 'toggle':
      fetchSettings()
        .then(settings => {
          const updated = settings.scripts.map(s =>
            s.id === id ? { ...s, enabled: !s.enabled } : s
          );
          chrome.storage.sync.set({ scripts: updated }, () => {
            if (chrome.runtime.lastError) {
              alert(`Operation failed: ${chrome.runtime.lastError.message}`);
            } else {
              renderUI({ scripts: updated });
            }
          });
        })
        .catch(err => alert(`Operation failed: ${err.message}`));
      break;

    case 'edit':
      chrome.runtime.openOptionsPage(() => {
        if (chrome.runtime.lastError) {
          alert(`Failed to open options: ${chrome.runtime.lastError.message}`);
        } else {
          sendCommand('editScript', { id });
        }
      });
      break;

    case 'delete':
      if (confirm('Are you sure you want to delete this script?')) {
        fetchSettings()
          .then(settings => {
            const updated = settings.scripts.filter(s => s.id !== id);
            chrome.storage.sync.set({ scripts: updated }, () => {
              if (chrome.runtime.lastError) {
                alert(`Operation failed: ${chrome.runtime.lastError.message}`);
              } else {
                renderUI({ scripts: updated });
              }
            });
          })
          .catch(err => alert(`Operation failed: ${err.message}`));
      }
      break;
  }
}

function initPopup() {
  const addBtn = document.getElementById('addScriptButton');
  const listContainer = document.getElementById('scriptList');

  addBtn.addEventListener('click', () => {
    chrome.runtime.openOptionsPage(() => {
      if (chrome.runtime.lastError) {
        alert(`Failed to open options: ${chrome.runtime.lastError.message}`);
      }
    });
  });

  listContainer.addEventListener('click', onActionClick);

  fetchSettings().then(renderUI).catch(err => {
    alert(`Failed to load settings: ${err.message}`);
  });
}

document.addEventListener('DOMContentLoaded', initPopup);
function getCurrentTabUrl() {
  return chrome.tabs
    .query({ active: true, currentWindow: true })
    .then(tabs => (tabs[0] ? tabs[0].url : ''));
}

const tabHandlers = {
  technical: async () => {
    const url = await getCurrentTabUrl();
    const loading = document.getElementById('technical-loading');
    const list = document.getElementById('technical-list');
    loading.classList.remove('hidden');
    chrome.runtime.sendMessage(
      { action: 'analyzeOnPage', value: { url } },
      res => {
        loading.classList.add('hidden');
        if (res && res.success) {
          list.textContent = JSON.stringify(res.payload, null, 2);
          list.classList.remove('hidden');
        }
      }
    );
  },
  performance: async () => {
    const url = await getCurrentTabUrl();
    const loading = document.getElementById('performance-loading');
    const list = document.getElementById('performance-list');
    loading.classList.remove('hidden');
    chrome.runtime.sendMessage(
      { action: 'getPerformanceMetrics', value: { url } },
      res => {
        loading.classList.add('hidden');
        if (res && res.success) {
          list.textContent = JSON.stringify(res.payload, null, 2);
          list.classList.remove('hidden');
        }
      }
    );
  },
  keywords: () => {
    document.getElementById('keywords-controls').classList.remove('hidden');
  },
  backlinks: async () => {
    const url = await getCurrentTabUrl();
    const domain = url ? new URL(url).hostname : '';
    const loading = document.getElementById('backlinks-loading');
    const list = document.getElementById('backlinks-list');
    loading.classList.remove('hidden');
    chrome.runtime.sendMessage(
      { action: 'getBacklinks', value: { domain } },
      res => {
        loading.classList.add('hidden');
        if (res && res.success) {
          list.textContent = JSON.stringify(res.payload, null, 2);
          list.classList.remove('hidden');
        }
      }
    );
  }
};

function activateTab(name) {
  document.querySelectorAll('.tab-panel').forEach(el => {
    el.hidden = el.id !== name;
    if (el.id === name) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });
  document.querySelectorAll('.tab-button').forEach(btn => {
    const active = btn.dataset.tab === name;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active);
  });
  if (tabHandlers[name]) {
    tabHandlers[name]();
  }
}

function initSeoAnalyzer() {
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => activateTab(btn.dataset.tab));
  });
  const active = document.querySelector('.tab-button.active');
  if (active) {
    activateTab(active.dataset.tab);
  }

  const searchBtn = document.getElementById('keyword-search');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const input = document.getElementById('keyword-input');
      const kw = input.value.trim();
      if (!kw) return;
      const loading = document.getElementById('keywords-loading');
      const list = document.getElementById('keywords-list');
      loading.classList.remove('hidden');
      chrome.runtime.sendMessage(
        { action: 'fetchKeywords', value: { keyword: kw } },
        res => {
          loading.classList.add('hidden');
          if (res && res.success) {
            list.textContent = JSON.stringify(res.payload, null, 2);
            list.classList.remove('hidden');
          }
        }
      );
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initPopup();
  initSeoAnalyzer();
});
