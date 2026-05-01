ALTER TABLE problems
ADD COLUMN external_source TEXT,
ADD COLUMN external_problem_key TEXT;

CREATE UNIQUE INDEX idx_problems_user_external_problem
    ON problems (user_id, external_source, external_problem_key)
    WHERE external_source IS NOT NULL AND external_problem_key IS NOT NULL;

CREATE TABLE problem_captures (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('leetcode')),
    external_problem_key TEXT NOT NULL,
    canonical_url TEXT NOT NULL,
    title TEXT,
    difficulty TEXT CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),
    description_html TEXT,
    topic_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    capture_state TEXT NOT NULL CHECK (
        capture_state IN ('ready', 'pending_enrichment', 'imported', 'archived', 'failed')
    ) DEFAULT 'ready',
    source_payload JSONB,
    fallback_title TEXT,
    fallback_difficulty TEXT,
    fallback_notes TEXT,
    problem_id BIGINT REFERENCES problems(id) ON DELETE SET NULL,
    last_error_code TEXT,
    last_error_message TEXT,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    imported_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_problem_captures_user_source_key
    ON problem_captures (user_id, source, external_problem_key);

CREATE INDEX idx_problem_captures_user_state_time
    ON problem_captures (user_id, capture_state, captured_at DESC);

CREATE TABLE extension_pairing_codes (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    device_name TEXT
);

CREATE INDEX idx_extension_pairing_codes_user_active
    ON extension_pairing_codes (user_id, expires_at DESC)
    WHERE used_at IS NULL;

CREATE TABLE extension_installations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    browser TEXT NOT NULL DEFAULT 'chrome',
    extension_version TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX idx_extension_installations_user_active
    ON extension_installations (user_id, created_at DESC)
    WHERE revoked_at IS NULL;

CREATE TABLE extension_refresh_tokens (
    id TEXT PRIMARY KEY,
    installation_id TEXT NOT NULL REFERENCES extension_installations(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    last_used_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    replaced_by_token_id TEXT REFERENCES extension_refresh_tokens(id) ON DELETE SET NULL
);

CREATE INDEX idx_extension_refresh_tokens_installation_active
    ON extension_refresh_tokens (installation_id, created_at DESC)
    WHERE revoked_at IS NULL;
