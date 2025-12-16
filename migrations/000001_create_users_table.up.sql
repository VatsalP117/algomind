CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    clerk_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    created_at TIMESTAMP(0) WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);