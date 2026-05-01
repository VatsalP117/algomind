DROP INDEX IF EXISTS idx_extension_refresh_tokens_installation_active;
DROP TABLE IF EXISTS extension_refresh_tokens;

DROP INDEX IF EXISTS idx_extension_installations_user_active;
DROP TABLE IF EXISTS extension_installations;

DROP INDEX IF EXISTS idx_extension_pairing_codes_user_active;
DROP TABLE IF EXISTS extension_pairing_codes;

DROP INDEX IF EXISTS idx_problem_captures_user_state_time;
DROP INDEX IF EXISTS idx_problem_captures_user_source_key;
DROP TABLE IF EXISTS problem_captures;

DROP INDEX IF EXISTS idx_problems_user_external_problem;

ALTER TABLE problems
DROP COLUMN IF EXISTS external_problem_key,
DROP COLUMN IF EXISTS external_source;
