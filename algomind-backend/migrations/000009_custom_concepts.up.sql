-- 1. Add user_id and base_concept_id to concepts
ALTER TABLE concepts ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE concepts ADD COLUMN base_concept_id BIGINT REFERENCES concepts(id) ON DELETE SET NULL;

-- 2. Fix uniqueness: system concepts unique by title, user concepts unique per user
ALTER TABLE concepts DROP CONSTRAINT concepts_title_key;
CREATE UNIQUE INDEX idx_concepts_system_title ON concepts (title) WHERE user_id IS NULL;
CREATE UNIQUE INDEX idx_concepts_user_override ON concepts (user_id, base_concept_id) 
    WHERE user_id IS NOT NULL AND base_concept_id IS NOT NULL;

-- 3. Performance indexes
CREATE INDEX idx_concepts_user_id ON concepts (user_id);

-- 4. Folders table
CREATE TABLE concept_folders (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    parent_folder_id BIGINT REFERENCES concept_folders(id) ON DELETE CASCADE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, parent_folder_id, name)
);

-- 5. Folder items (which concept goes in which folder)
CREATE TABLE concept_folder_items (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    folder_id BIGINT NOT NULL REFERENCES concept_folders(id) ON DELETE CASCADE,
    concept_id BIGINT NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
    sort_order INT NOT NULL DEFAULT 0,
    UNIQUE (user_id, concept_id)
);
CREATE INDEX idx_concept_folder_items_folder ON concept_folder_items (folder_id);
