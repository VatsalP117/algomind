import { DEFAULT_SETTINGS } from './config'
import type { ExtensionSession, ExtensionSettings } from './types'

const SESSION_KEY = 'algomind:session'
const SETTINGS_KEY = 'algomind:settings'

export async function getSession(): Promise<ExtensionSession | null> {
    const values = await chrome.storage.local.get(SESSION_KEY)
    return (values[SESSION_KEY] as ExtensionSession | undefined) ?? null
}

export async function setSession(session: ExtensionSession) {
    await chrome.storage.local.set({ [SESSION_KEY]: session })
}

export async function clearSession() {
    await chrome.storage.local.remove(SESSION_KEY)
}

export async function getSettings(): Promise<ExtensionSettings> {
    const values = await chrome.storage.local.get(SETTINGS_KEY)
    return {
        ...DEFAULT_SETTINGS,
        ...((values[SETTINGS_KEY] as ExtensionSettings | undefined) ?? {}),
    }
}

export async function setSettings(settings: ExtensionSettings) {
    await chrome.storage.local.set({ [SETTINGS_KEY]: settings })
}

export async function resetSettings() {
    await setSettings(DEFAULT_SETTINGS)
}
