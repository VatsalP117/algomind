-- Remove streak tracking columns from users table
ALTER TABLE users 
DROP COLUMN IF EXISTS current_streak,
DROP COLUMN IF EXISTS longest_streak,
DROP COLUMN IF EXISTS last_review_date;
