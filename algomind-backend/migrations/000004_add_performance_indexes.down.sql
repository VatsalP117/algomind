-- Rollback: remove all indexes added in the up migration
DROP INDEX IF EXISTS idx_problems_user_id;
DROP INDEX IF EXISTS idx_problems_concept_id;
DROP INDEX IF EXISTS idx_review_logs_entity;
