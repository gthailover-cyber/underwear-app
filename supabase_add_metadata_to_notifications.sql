-- Add metadata column to notifications table for storing extra data like room_id, invite_id
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Refresh schema cache (usually automatic, but good to know)
NOTIFY pgrst, 'reload config';
