-- Create a migration to add 'likes' to 'rooms' table
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;
