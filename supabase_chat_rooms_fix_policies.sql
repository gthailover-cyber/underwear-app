-- Clean up and recreate chat_rooms policies
-- Run this FIRST if you get "policy already exists" error

-- Drop existing policies
DROP POLICY IF EXISTS "Public rooms are viewable by everyone" ON public.chat_rooms;
DROP POLICY IF EXISTS "Authenticated users can create rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Room hosts can update their rooms" ON public.chat_rooms;
DROP POLICY IF EXISTS "Room hosts can delete their rooms" ON public.chat_rooms;

-- Recreate policies
CREATE POLICY "Public rooms are viewable by everyone"
  ON public.chat_rooms
  FOR SELECT
  USING (type = 'public' OR auth.uid() = host_id);

CREATE POLICY "Authenticated users can create rooms"
  ON public.chat_rooms
  FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Room hosts can update their rooms"
  ON public.chat_rooms
  FOR UPDATE
  USING (auth.uid() = host_id);

CREATE POLICY "Room hosts can delete their rooms"
  ON public.chat_rooms
  FOR DELETE
  USING (auth.uid() = host_id);
