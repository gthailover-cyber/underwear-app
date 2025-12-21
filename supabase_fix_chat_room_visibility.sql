-- Fix chat_rooms SELECT policy to allow everyone to see private rooms
-- This allows users to see the room in the list and request to join

DROP POLICY IF EXISTS "Public rooms are viewable by everyone" ON public.chat_rooms;

CREATE POLICY "Everyone can view all rooms"
  ON public.chat_rooms
  FOR SELECT
  USING (true);
