-- Add streak tracking columns to users table
ALTER TABLE users 
ADD COLUMN current_streak INT NOT NULL DEFAULT 0,
ADD COLUMN longest_streak INT NOT NULL DEFAULT 0,
ADD COLUMN last_review_date DATE;
