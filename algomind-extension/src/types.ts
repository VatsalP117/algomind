export type Installation = {
    id: string
    name: string
    browser: string
    extension_version?: string | null
    created_at: string
    last_seen_at?: string | null
    revoked_at?: string | null
}

export type ExtensionSession = {
    installation: Installation
    accessToken: string
    accessTokenExpiresAt: string
    refreshToken: string
    refreshTokenExpiresAt: string
}

export type ExtensionSettings = {
    apiBaseUrl: string
    appBaseUrl: string
}

export type PairResponse = {
    installation: Installation
    tokens: {
        access_token: string
        access_token_expires_at: string
        refresh_token: string
        refresh_token_expires_at: string
    }
}

export type PageContext = {
    supported: boolean
    url: string | null
    title: string | null
}

export type SaveResponse = {
    status: 'captured' | 'already_captured' | 'already_imported'
    capture_id?: number | null
    problem_id?: number | null
    capture_state: string
    title?: string | null
    canonical_url: string
    next_action: 'finish_in_algomind' | 'open_existing_problem'
}
