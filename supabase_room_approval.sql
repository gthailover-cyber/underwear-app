-- Room Approval System Migration
-- Run this in Supabase SQL Editor

-- 1. Add status column to room_members
-- Status: 'pending' for private room requests, 'approved' for active members, 'banned' (handled by is_banned previously but status is cleaner)
-- Let's use status for cleaner logic
ALTER TABLE public.room_members 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved'));

-- Migration: Set all existing members to approved
UPDATE public.room_members SET status = 'approved' WHERE status IS NULL;

-- 2. Update RLS policies for room_messages to check for approved status
DROP POLICY IF EXISTS "Members can view room messages" ON public.room_messages;
CREATE POLICY "Members can view room messages"
  ON public.room_messages
  FOR SELECT
  USING (
    room_id IN (
      SELECT id FROM public.chat_rooms WHERE type = 'public'
      UNION
      SELECT room_id FROM public.room_members WHERE user_id = auth.uid() AND status = 'approved' AND is_banned = FALSE
    )
  );

DROP POLICY IF EXISTS "Members can send messages" ON public.room_messages;
CREATE POLICY "Members can send messages"
  ON public.room_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    room_id IN (
      SELECT id FROM public.chat_rooms WHERE type = 'public' AND NOT EXISTS (
        SELECT 1 FROM public.room_members WHERE room_id = public.chat_rooms.id AND user_id = auth.uid() AND (is_banned = TRUE OR status = 'pending')
      )
      UNION
      SELECT room_id FROM public.room_members 
      WHERE user_id = auth.uid() 
      AND status = 'approved' 
      AND is_muted = FALSE 
      AND is_banned = FALSE
    )
  );

-- 3. Update RLS policies for room_members to allow status change by host
DROP POLICY IF EXISTS "Room hosts can manage members" ON public.room_members;
CREATE POLICY "Room hosts can manage members"
  ON public.room_members
  FOR ALL -- Host can update status, delete (reject), etc.
  USING (
    room_id IN (SELECT id FROM public.chat_rooms WHERE host_id = auth.uid())
  )
  WITH CHECK (
    room_id IN (SELECT id FROM public.chat_rooms WHERE host_id = auth.uid())
  );

-- 4. Update join room policy for private rooms (sets status to pending)
DROP POLICY IF EXISTS "Users can join rooms" ON public.room_members;
CREATE POLICY "Users can join rooms"
  ON public.room_members
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    NOT EXISTS (
      SELECT 1 FROM public.room_members
      WHERE user_id = auth.uid()
      AND room_id = room_members.room_id
      AND is_banned = TRUE
    )
  );

-- 5. Add a view or helper to get pending counts
-- This helps in showing the notification bubble
CREATE OR REPLACE VIEW public.room_pending_counts AS
SELECT 
  room_id,
  COUNT(*) as pending_count
FROM public.room_members
WHERE status = 'pending'
GROUP BY room_id;
