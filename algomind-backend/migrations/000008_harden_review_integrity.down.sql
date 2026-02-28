DROP TRIGGER IF EXISTS trg_problems_cleanup_reviews ON problems;
DROP TRIGGER IF EXISTS trg_concepts_cleanup_reviews ON concepts;
DROP TRIGGER IF EXISTS trg_review_states_validate_entity ON review_states;
DROP TRIGGER IF EXISTS trg_review_logs_validate_entity ON review_logs;

DROP FUNCTION IF EXISTS cleanup_problem_reviews();
DROP FUNCTION IF EXISTS cleanup_concept_reviews();
DROP FUNCTION IF EXISTS validate_review_entity();

ALTER TABLE problems
DROP CONSTRAINT IF EXISTS problems_answer_not_blank,
DROP CONSTRAINT IF EXISTS problems_summary_not_blank,
DROP CONSTRAINT IF EXISTS problems_title_not_blank;

ALTER TABLE concepts
DROP CONSTRAINT IF EXISTS concepts_content_not_blank,
DROP CONSTRAINT IF EXISTS concepts_title_not_blank;

ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_longest_ge_current_streak,
DROP CONSTRAINT IF EXISTS users_longest_streak_non_negative,
DROP CONSTRAINT IF EXISTS users_current_streak_non_negative;

ALTER TABLE review_states
DROP CONSTRAINT IF EXISTS review_states_ease_factor_bounds,
DROP CONSTRAINT IF EXISTS review_states_streak_non_negative,
DROP CONSTRAINT IF EXISTS review_states_interval_days_non_negative;
