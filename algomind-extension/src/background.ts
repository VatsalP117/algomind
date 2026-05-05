import type {
    ExtensionSession,
    PageContext,
    PairResponse,
    SaveResponse,
} from './types'
import { clearSession, getSession, getSettings, setSession } from './storage'

type RuntimeMessage =
    | {
          type: 'algomind:get-session'
      }
    | {
          type: 'algomind:pair'
          code: string
          installationName: string
      }
    | {
          type: 'algomind:disconnect'
      }
    | {
          type: 'algomind:save-problem'
          pageContext: PageContext
      }
    | {
          type: 'algomind:open-path'
          path: string
      }

let refreshInFlight: Promise<ExtensionSession | null> | null = null

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _, sendResponse) => {
    ;(async () => {
        switch (message.type) {
            case 'algomind:get-session': {
                const session = await getSession()
                sendResponse({
                    paired: Boolean(session?.refreshToken),
                    installation: session?.installation ?? null,
                })
                break
            }
            case 'algomind:pair': {
                const session = await pairExtension(
                    message.code,
                    message.installationName,
                )
                sendResponse({ ok: true, session })
                break
            }
            case 'algomind:disconnect': {
                await disconnectExtension()
                sendResponse({ ok: true })
                break
            }
            case 'algomind:save-problem': {
                const result = await saveProblem(message.pageContext)
                sendResponse({ ok: true, result })
                break
            }
            case 'algomind:open-path': {
                const settings = await getSettings()
                await chrome.tabs.create({
                    url: `${settings.appBaseUrl}${message.path}`,
                })
                sendResponse({ ok: true })
                break
            }
            default:
                sendResponse({ ok: false, error: 'Unknown message type' })
        }
    })().catch(async (error: unknown) => {
        sendResponse({
            ok: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        })
    })

    return true
})

async function pairExtension(code: string, installationName: string) {
    const settings = await getSettings()
    const response = await fetch(`${settings.apiBaseUrl}/extension/auth/pair`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            code,
            installation_name: installationName || 'Chrome Extension',
            browser: 'chrome',
            extension_version: chrome.runtime.getManifest().version,
        }),
    })

    const payload = (await readJson(response)) as PairResponse
    if (!response.ok) {
        throw new Error(readErrorMessage(payload, 'Failed to pair extension'))
    }

    const session = mapPairResponseToSession(payload)
    await setSession(session)
    return session
}

async function disconnectExtension() {
    const session = await getSession()
    if (!session) return

    try {
        const accessToken = await ensureAccessToken()
        const settings = await getSettings()
        await fetch(`${settings.apiBaseUrl}/extension/auth/logout`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })
    } catch {
        // best-effort server logout
    } finally {
        await clearSession()
    }
}

async function saveProblem(pageContext: PageContext) {
    if (!pageContext.supported || !pageContext.url) {
        throw new Error('Open a LeetCode problem page before saving')
    }

    const settings = await getSettings()
    const accessToken = await ensureAccessToken()

    const doSave = async (token: string) => {
        const response = await fetch(`${settings.apiBaseUrl}/extension/captures`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: pageContext.url,
                fallback_title: pageContext.title,
            }),
        })

        const payload = (await readJson(response)) as SaveResponse
        if (response.status === 401) {
            return null
        }
        if (!response.ok) {
            throw new Error(
                readErrorMessage(payload, 'Failed to save problem to Algomind'),
            )
        }
        return payload
    }

    const firstAttempt = await doSave(accessToken)
    if (firstAttempt) {
        return firstAttempt
    }

    const refreshedToken = await ensureAccessToken(true)
    const secondAttempt = await doSave(refreshedToken)
    if (!secondAttempt) {
        throw new Error('Extension session expired. Pair the extension again.')
    }

    return secondAttempt
}

async function ensureAccessToken(forceRefresh = false): Promise<string> {
    const session = await getSession()
    if (!session) {
        throw new Error('Pair the extension first')
    }

    const expiresAt = new Date(session.accessTokenExpiresAt).getTime()
    if (!forceRefresh && expiresAt - Date.now() > 30_000) {
        return session.accessToken
    }

    const refreshed = await refreshSession(session)
    if (!refreshed) {
        throw new Error('Extension session expired. Pair the extension again.')
    }

    return refreshed.accessToken
}

async function refreshSession(currentSession: ExtensionSession) {
    if (refreshInFlight) {
        return refreshInFlight
    }

    refreshInFlight = (async () => {
        const settings = await getSettings()
        const response = await fetch(
            `${settings.apiBaseUrl}/extension/auth/refresh`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refresh_token: currentSession.refreshToken,
                }),
            },
        )

        const payload = (await readJson(response)) as PairResponse
        if (!response.ok) {
            await clearSession()
            throw new Error(
                readErrorMessage(payload, 'Failed to refresh extension session'),
            )
        }

        const nextSession = mapPairResponseToSession(payload)
        await setSession(nextSession)
        return nextSession
    })()

    try {
        return await refreshInFlight
    } finally {
        refreshInFlight = null
    }
}

function mapPairResponseToSession(payload: PairResponse): ExtensionSession {
    return {
        installation: payload.installation,
        accessToken: payload.tokens.access_token,
        accessTokenExpiresAt: payload.tokens.access_token_expires_at,
        refreshToken: payload.tokens.refresh_token,
        refreshTokenExpiresAt: payload.tokens.refresh_token_expires_at,
    }
}

async function readJson(response: Response) {
    const text = await response.text()
    if (!text) {
        return {}
    }

    try {
        return JSON.parse(text)
    } catch {
        return { message: text }
    }
}

function readErrorMessage(
    payload: unknown,
    fallbackMessage: string,
): string {
    if (
        payload &&
        typeof payload === 'object' &&
        'message' in payload &&
        typeof payload.message === 'string'
    ) {
        return payload.message
    }

    return fallbackMessage
}
