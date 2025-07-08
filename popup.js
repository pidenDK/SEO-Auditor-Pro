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