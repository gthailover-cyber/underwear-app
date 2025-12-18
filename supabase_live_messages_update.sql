-- Add username and avatar columns to messages table for Realtime performance
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS username text,
ADD COLUMN IF NOT EXISTS avatar text;

-- Optional: Add index for performance
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON public.messages(room_id);
