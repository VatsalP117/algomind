-- =========================
-- PATTERNS (per-user normalized pattern vocabulary)
-- =========================
CREATE TABLE patterns (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (length(btrim(name)) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Case-insensitive uniqueness per user.
CREATE UNIQUE INDEX idx_patterns_user_name_unique
    ON patterns (user_id, lower(name));

CREATE INDEX idx_patterns_user
    ON patterns (user_id);

-- =========================
-- PROBLEM PATTERN CARDS (one per problem)
-- =========================
CREATE TABLE problem_pattern_cards (
    id BIGSERIAL PRIMARY KEY,
    problem_id BIGINT NOT NULL UNIQUE REFERENCES problems(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed')),
    recognition_cues JSONB NOT NULL DEFAULT '[]'::jsonb,
    invariant TEXT NOT NULL DEFAULT '',
    first_move TEXT NOT NULL DEFAULT '',
    common_mistake TEXT NOT NULL DEFAULT '',
    contrasting_pattern TEXT NOT NULL DEFAULT '',
    explanation TEXT NOT NULL DEFAULT '',
    model TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_problem_pattern_cards_user
    ON problem_pattern_cards (user_id);

-- =========================
-- PROBLEM PATTERNS (ordered many-to-many, primary/supporting)
-- =========================
CREATE TABLE problem_patterns (
    id BIGSERIAL PRIMARY KEY,
    card_id BIGINT NOT NULL REFERENCES problem_pattern_cards(id) ON DELETE CASCADE,
    pattern_id BIGINT NOT NULL REFERENCES patterns(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('primary', 'supporting')),
    rationale TEXT NOT NULL DEFAULT '',
    position INT NOT NULL CHECK (position >= 0),
    UNIQUE (card_id, position),
    UNIQUE (card_id, pattern_id)
);

-- Enforce at most one primary pattern per card.
CREATE UNIQUE INDEX idx_problem_patterns_one_primary
    ON problem_patterns (card_id)
    WHERE role = 'primary';

CREATE INDEX idx_problem_patterns_pattern
    ON problem_patterns (pattern_id);

-- =========================
-- REVIEW LOG EVIDENCE (pattern recognition)
-- =========================
ALTER TABLE review_logs
ADD COLUMN pattern_guess TEXT,
ADD COLUMN pattern_recognition TEXT CHECK (
    pattern_recognition IN ('recognized', 'partial', 'missed')
);

CREATE INDEX idx_review_logs_pattern_recognition
    ON review_logs (pattern_recognition)
    WHERE pattern_recognition IS NOT NULL;