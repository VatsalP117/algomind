-- =========================
-- USERS (Auth-owned)
-- =========================
CREATE TABLE users (
    id TEXT PRIMARY KEY,          -- Clerk user ID
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- CONCEPTS (Theory / Fundamentals)
-- =========================
CREATE TABLE concepts (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL UNIQUE,
    description TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- PROBLEMS (User-added practice)
-- =========================
CREATE TABLE problems (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    concept_id BIGINT NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,

    title TEXT NOT NULL,
    link TEXT,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('EASY', 'MEDIUM', 'HARD')),

    summary TEXT NOT NULL,
    description TEXT,
    answer TEXT NOT NULL,
    hints TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- REVIEW STATES (SRS engine)
-- =========================
CREATE TABLE review_states (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    entity_type TEXT NOT NULL CHECK (entity_type IN ('concept', 'problem')),
    entity_id BIGINT NOT NULL,

    next_review_at TIMESTAMPTZ NOT NULL,
    interval_days INT NOT NULL,
    ease_factor FLOAT NOT NULL,
    streak INT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (user_id, entity_type, entity_id)
);

-- =========================
-- REVIEW LOGS (History / Heatmap)
-- =========================
CREATE TABLE review_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    entity_type TEXT NOT NULL CHECK (entity_type IN ('concept', 'problem')),
    entity_id BIGINT NOT NULL,

    rating TEXT NOT NULL CHECK (rating IN ('AGAIN', 'GOOD', 'EASY')),
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================
-- INDEXES (Performance)
-- =========================
CREATE INDEX idx_review_states_due
    ON review_states (user_id, next_review_at);

CREATE INDEX idx_review_logs_user_time
    ON review_logs (user_id, reviewed_at);
