-- Reverse all changes from up.sql

DROP INDEX IF EXISTS idx_concept_folder_items_folder;
DROP TABLE IF EXISTS concept_folder_items;
DROP TABLE IF EXISTS concept_folders;

DROP INDEX IF EXISTS idx_concepts_user_id;
DROP INDEX IF EXISTS idx_concepts_user_override;
DROP INDEX IF EXISTS idx_concepts_system_title;

-- Note: re-adding the unique constraint only works if titles are indeed unique
-- This might fail if there are duplicates from the down migration, but it's standard for down scripts.
ALTER TABLE concepts ADD CONSTRAINT concepts_title_key UNIQUE (title);

ALTER TABLE concepts DROP COLUMN IF EXISTS base_concept_id;
ALTER TABLE concepts DROP COLUMN IF EXISTS user_id;
