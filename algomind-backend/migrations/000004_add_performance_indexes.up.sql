-- Index 1: Fetching all problems for a specific user
-- Used every time the dashboard or problems list loads (WHERE user_id = $1)
-- Without this, Postgres scans the ENTIRE problems table for every request
CREATE INDEX idx_problems_user_id ON problems (user_id);

-- Index 2: Fetching problems assigned to a specific concept
-- Used on the concepts page to show which problems belong to each concept
-- Without this, filtering by concept_id requires a full table scan
CREATE INDEX idx_problems_concept_id ON problems (concept_id);

-- Index 3: Looking up review history for a specific item
-- Used when fetching review logs for a specific problem/concept
-- Composite index covers: user_id + entity_type + entity_id together
-- Postgres can satisfy the full WHERE clause from this index alone (no table hit)
CREATE INDEX idx_review_logs_entity ON review_logs (user_id, entity_type, entity_id);
