
-- Add viewer_count column to rooms table
ALTER TABLE public.rooms
ADD COLUMN IF NOT EXISTS viewer_count int DEFAULT 0;

-- Optional: Reset counts to 0
UPDATE public.rooms SET viewer_count = 0;
