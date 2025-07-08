(function() {
    const defaultSettings = {
        enabled: false,
        scripts: []
    };

    async function initPopupScript() {
        try {
            const settings = await loadStoredSettings();
            updatePopupUI(settings);
            attachEventListeners();
        } catch (err) {
            console.error('Initialization error:', err);
        }
    }

    function loadStoredSettings() {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.get(defaultSettings, items => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                resolve(items);
            });
        });
    }

    function attachEventListeners() {
        const toggle = document.getElementById('toggleExtension');
        const scriptInput = document.getElementById('scriptInput');
        const saveButton = document.getElementById('saveButton');
        const resetButton = document.getElementById('resetButton');

        if (toggle) {
            toggle.addEventListener('change', async e => {
                const enabled = e.target.checked;
                try {
                    await sendMessageToBackground('updateEnabled', { enabled });
                    setStatus('Extension ' + (enabled ? 'enabled' : 'disabled'));
                } catch (err) {
                    console.error(err);
                    setStatus('Error updating toggle');
                }
            });
        }

        if (saveButton && scriptInput) {
            saveButton.addEventListener('click', async () => {
                const raw = scriptInput.value || '';
                const scripts = raw.split('\n').map(s => s.trim()).filter(s => s);
                try {
                    await sendMessageToBackground('updateScripts', { scripts });
                    setStatus('Scripts saved');
                } catch (err) {
                    console.error(err);
                    setStatus('Error saving scripts');
                }
            });
        }

        if (resetButton) {
            resetButton.addEventListener('click', async () => {
                try {
                    await sendMessageToBackground('resetSettings', {});
                    const settings = await loadStoredSettings();
                    updatePopupUI(settings);
                    setStatus('Settings reset');
                } catch (err) {
                    console.error(err);
                    setStatus('Error resetting settings');
                }
            });
        }
    }

    function sendMessageToBackground(action, payload, timeout = 5000) {
        return new Promise((resolve, reject) => {
            let settled = false;
            const timer = setTimeout(() => {
                if (!settled) {
                    settled = true;
                    reject(new Error('Timeout waiting for background response'));
                }
            }, timeout);

            chrome.runtime.sendMessage({ action, payload }, response => {
                clearTimeout(timer);
                if (settled) return;
                settled = true;
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(response);
                }
            });
        });
    }

    function updatePopupUI(settings) {
        const toggle = document.getElementById('toggleExtension');
        const scriptInput = document.getElementById('scriptInput');
        if (toggle) {
            toggle.checked = Boolean(settings.enabled);
        }
        if (scriptInput) {
            scriptInput.value = Array.isArray(settings.scripts) ? settings.scripts.join('\n') : '';
        }
    }

    function setStatus(message) {
        const statusEl = document.getElementById('status');
        if (statusEl) {
            statusEl.textContent = message;
            setTimeout(() => { statusEl.textContent = ''; }, 3000);
        }
    }

    document.addEventListener('DOMContentLoaded', initPopupScript);
})();