-- 1. Drop the existing restriction
ALTER TABLE review_logs 
DROP CONSTRAINT IF EXISTS review_logs_rating_check;

-- 2. Add the new restriction including 'HARD'
ALTER TABLE review_logs 
ADD CONSTRAINT review_logs_rating_check 
CHECK (rating IN ('AGAIN', 'HARD', 'GOOD', 'EASY'));