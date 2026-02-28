-- Remove invalid polymorphic references before adding strict validation.
DELETE FROM review_states rs
WHERE (rs.entity_type = 'problem' AND NOT EXISTS (
    SELECT 1
    FROM problems p
    WHERE p.id = rs.entity_id
      AND p.user_id = rs.user_id
))
OR (rs.entity_type = 'concept' AND NOT EXISTS (
    SELECT 1
    FROM concepts c
    WHERE c.id = rs.entity_id
));

DELETE FROM review_logs rl
WHERE (rl.entity_type = 'problem' AND NOT EXISTS (
    SELECT 1
    FROM problems p
    WHERE p.id = rl.entity_id
      AND p.user_id = rl.user_id
))
OR (rl.entity_type = 'concept' AND NOT EXISTS (
    SELECT 1
    FROM concepts c
    WHERE c.id = rl.entity_id
));

-- DB-level guardrails for SRS/user counters.
ALTER TABLE review_states
ADD CONSTRAINT review_states_interval_days_non_negative
CHECK (interval_days >= 0) NOT VALID,
ADD CONSTRAINT review_states_streak_non_negative
CHECK (streak >= 0) NOT VALID,
ADD CONSTRAINT review_states_ease_factor_bounds
CHECK (ease_factor >= 1.3 AND ease_factor <= 3.0) NOT VALID;

ALTER TABLE users
ADD CONSTRAINT users_current_streak_non_negative
CHECK (current_streak >= 0) NOT VALID,
ADD CONSTRAINT users_longest_streak_non_negative
CHECK (longest_streak >= 0) NOT VALID,
ADD CONSTRAINT users_longest_ge_current_streak
CHECK (longest_streak >= current_streak) NOT VALID;

-- DB-level non-empty checks for required text fields.
ALTER TABLE concepts
ADD CONSTRAINT concepts_title_not_blank
CHECK (length(btrim(title)) > 0) NOT VALID,
ADD CONSTRAINT concepts_content_not_blank
CHECK (length(btrim(content)) > 0) NOT VALID;

ALTER TABLE problems
ADD CONSTRAINT problems_title_not_blank
CHECK (length(btrim(title)) > 0) NOT VALID,
ADD CONSTRAINT problems_summary_not_blank
CHECK (length(btrim(summary)) > 0) NOT VALID,
ADD CONSTRAINT problems_answer_not_blank
CHECK (length(btrim(answer)) > 0) NOT VALID;

-- Validate entity references for review tables.
CREATE OR REPLACE FUNCTION validate_review_entity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.entity_type = 'problem' THEN
        IF NOT EXISTS (
            SELECT 1
            FROM problems p
            WHERE p.id = NEW.entity_id
              AND p.user_id = NEW.user_id
        ) THEN
            RAISE EXCEPTION 'invalid review reference: problem % for user % does not exist',
                NEW.entity_id, NEW.user_id;
        END IF;
    ELSIF NEW.entity_type = 'concept' THEN
        IF NOT EXISTS (
            SELECT 1
            FROM concepts c
            WHERE c.id = NEW.entity_id
        ) THEN
            RAISE EXCEPTION 'invalid review reference: concept % does not exist', NEW.entity_id;
        END IF;
    ELSE
        RAISE EXCEPTION 'invalid entity_type: %', NEW.entity_type;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_review_states_validate_entity ON review_states;
CREATE TRIGGER trg_review_states_validate_entity
BEFORE INSERT OR UPDATE OF user_id, entity_type, entity_id
ON review_states
FOR EACH ROW
EXECUTE FUNCTION validate_review_entity();

DROP TRIGGER IF EXISTS trg_review_logs_validate_entity ON review_logs;
CREATE TRIGGER trg_review_logs_validate_entity
BEFORE INSERT OR UPDATE OF user_id, entity_type, entity_id
ON review_logs
FOR EACH ROW
EXECUTE FUNCTION validate_review_entity();

-- Ensure review state/history is removed when a problem is deleted.
CREATE OR REPLACE FUNCTION cleanup_problem_reviews()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM review_states
    WHERE entity_type = 'problem'
      AND entity_id = OLD.id;

    DELETE FROM review_logs
    WHERE entity_type = 'problem'
      AND entity_id = OLD.id;

    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_problems_cleanup_reviews ON problems;
CREATE TRIGGER trg_problems_cleanup_reviews
AFTER DELETE ON problems
FOR EACH ROW
EXECUTE FUNCTION cleanup_problem_reviews();

-- Keep concept review rows clean on concept deletion too.
CREATE OR REPLACE FUNCTION cleanup_concept_reviews()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM review_states
    WHERE entity_type = 'concept'
      AND entity_id = OLD.id;

    DELETE FROM review_logs
    WHERE entity_type = 'concept'
      AND entity_id = OLD.id;

    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_concepts_cleanup_reviews ON concepts;
CREATE TRIGGER trg_concepts_cleanup_reviews
AFTER DELETE ON concepts
FOR EACH ROW
EXECUTE FUNCTION cleanup_concept_reviews();
