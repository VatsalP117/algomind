import { DEFAULT_SETTINGS } from './config';
const SESSION_KEY = 'algomind:session';
const SETTINGS_KEY = 'algomind:settings';
export async function getSession() {
    const values = await chrome.storage.local.get(SESSION_KEY);
    return values[SESSION_KEY] ?? null;
}
export async function setSession(session) {
    await chrome.storage.local.set({ [SESSION_KEY]: session });
}
export async function clearSession() {
    await chrome.storage.local.remove(SESSION_KEY);
}
export async function getSettings() {
    const values = await chrome.storage.local.get(SETTINGS_KEY);
    return {
        ...DEFAULT_SETTINGS,
        ...(values[SETTINGS_KEY] ?? {}),
    };
}
export async function setSettings(settings) {
    await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}
export async function resetSettings() {
    await setSettings(DEFAULT_SETTINGS);
}
