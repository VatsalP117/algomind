-- 1. Delete or update any 'HARD' entries so the constraint doesn't fail
DELETE FROM review_logs WHERE rating = 'HARD'; 

-- 2. Drop the new restriction
ALTER TABLE review_logs 
DROP CONSTRAINT IF EXISTS review_logs_rating_check;

-- 3. Restore the original restriction
ALTER TABLE review_logs 
ADD CONSTRAINT review_logs_rating_check 
CHECK (rating IN ('AGAIN', 'GOOD', 'EASY'));