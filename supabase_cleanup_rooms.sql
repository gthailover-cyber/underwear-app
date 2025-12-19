-- Create a migration to add 'last_active_at' to 'rooms' table
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone default timezone('utc'::text, now());
