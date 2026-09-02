DROP INDEX IF EXISTS idx_review_logs_pattern_recognition;

ALTER TABLE review_logs
DROP COLUMN IF EXISTS pattern_recognition,
DROP COLUMN IF EXISTS pattern_guess;

DROP INDEX IF EXISTS idx_problem_patterns_one_primary;
DROP INDEX IF EXISTS idx_problem_patterns_pattern;
DROP TABLE IF EXISTS problem_patterns;

DROP INDEX IF EXISTS idx_problem_pattern_cards_user;
DROP TABLE IF EXISTS problem_pattern_cards;

DROP INDEX IF EXISTS idx_patterns_user_name_unique;
DROP INDEX IF EXISTS idx_patterns_user;
DROP TABLE IF EXISTS patterns;