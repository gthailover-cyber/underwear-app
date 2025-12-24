
-- 1. Drop existing constraint if possible (or update check constraint)
ALTER TABLE public.room_donation_goals DROP CONSTRAINT IF EXISTS room_donation_goals_status_check;

-- 2. Add corrected check constraint including 'refunded'
ALTER TABLE public.room_donation_goals 
ADD CONSTRAINT room_donation_goals_status_check 
CHECK (status IN ('active', 'completed', 'expired', 'refunded'));
