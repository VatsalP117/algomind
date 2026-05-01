import { DEFAULT_SETTINGS } from './config';
import { getSettings, setSettings } from './storage';
const apiBaseUrlInput = element('api-base-url');
const appBaseUrlInput = element('app-base-url');
const saveButton = element('save-settings');
const resetButton = element('reset-settings');
const statusLabel = element('settings-status');
saveButton.addEventListener('click', async () => {
    try {
        const apiBaseUrl = normalizeUrl(apiBaseUrlInput.value);
        const appBaseUrl = normalizeUrl(appBaseUrlInput.value);
        await setSettings({ apiBaseUrl, appBaseUrl });
        statusLabel.textContent = 'Settings saved';
    }
    catch (error) {
        statusLabel.textContent =
            error instanceof Error ? error.message : 'Invalid URL';
    }
});
resetButton.addEventListener('click', async () => {
    apiBaseUrlInput.value = DEFAULT_SETTINGS.apiBaseUrl;
    appBaseUrlInput.value = DEFAULT_SETTINGS.appBaseUrl;
    await setSettings(DEFAULT_SETTINGS);
    statusLabel.textContent = 'Defaults restored';
});
void loadSettings();
async function loadSettings() {
    const settings = await getSettings();
    apiBaseUrlInput.value = settings.apiBaseUrl;
    appBaseUrlInput.value = settings.appBaseUrl;
}
function normalizeUrl(value) {
    const trimmed = value.trim().replace(/\/$/, '');
    new URL(trimmed);
    return trimmed;
}
function element(id) {
    const target = document.getElementById(id);
    if (!target) {
        throw new Error(`Missing element #${id}`);
    }
    return target;
}
