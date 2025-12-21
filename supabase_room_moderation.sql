-- Add mute and ban columns to room_members
-- Run this in Supabase SQL Editor

-- 1. Add columns to room_members
ALTER TABLE public.room_members 
ADD COLUMN IF NOT EXISTS is_muted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;

-- 2. Update RLS policies for room_messages to check for mute
-- Drop old send message policy
DROP POLICY IF EXISTS "Members can send messages" ON public.room_messages;

-- Create new send message policy that checks for mute
CREATE POLICY "Members can send messages"
  ON public.room_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    room_id IN (
      -- Is it a public room? (Need to check if banned)
      SELECT id FROM public.chat_rooms 
      WHERE type = 'public' 
      AND NOT EXISTS (
        SELECT 1 FROM public.room_members 
        WHERE room_id = public.chat_rooms.id 
        AND user_id = auth.uid() 
        AND is_banned = TRUE
      )
      UNION
      -- Is the user a non-muted, non-banned member?
      SELECT room_id FROM public.room_members 
      WHERE user_id = auth.uid() 
      AND is_muted = FALSE 
      AND is_banned = FALSE
    )
  );

-- 3. Update RLS policies for room_members to prevent banned users from joining
DROP POLICY IF EXISTS "Users can join rooms" ON public.room_members;

CREATE POLICY "Users can join rooms"
  ON public.room_members
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    NOT EXISTS (
      -- Check if they were previously banned from this room
      -- (This assumes we keep banned rows in room_members)
      SELECT 1 FROM public.room_members
      WHERE user_id = auth.uid()
      AND room_id = room_members.room_id
      AND is_banned = TRUE
    )
  );

-- 4. Enable Room Hosts to manage members (Mute/Ban)
CREATE POLICY "Room hosts can manage members"
  ON public.room_members
  FOR UPDATE
  USING (
    room_id IN (SELECT id FROM public.chat_rooms WHERE host_id = auth.uid())
  )
  WITH CHECK (
    room_id IN (SELECT id FROM public.chat_rooms WHERE host_id = auth.uid())
  );
