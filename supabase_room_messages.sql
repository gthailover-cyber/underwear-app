-- Add room_messages table only (run this after fixing policies)
-- This is a separate migration to add just the messages table

-- Create room_messages table for group chat messages
CREATE TABLE IF NOT EXISTS public.room_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on room_messages
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Members can view room messages" ON public.room_messages;
DROP POLICY IF EXISTS "Members can send messages" ON public.room_messages;

-- Policy: Members can view messages in their rooms
CREATE POLICY "Members can view room messages"
  ON public.room_messages
  FOR SELECT
  USING (
    room_id IN (
      SELECT id FROM public.chat_rooms WHERE type = 'public'
      UNION
      SELECT room_id FROM public.room_members WHERE user_id = auth.uid()
    )
  );

-- Policy: Members can send messages
CREATE POLICY "Members can send messages"
  ON public.room_messages
  FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    room_id IN (
      SELECT id FROM public.chat_rooms WHERE type = 'public'
      UNION
      SELECT room_id FROM public.room_members WHERE user_id = auth.uid()
    )
  );

-- Create indexes for room_messages
CREATE INDEX IF NOT EXISTS idx_room_messages_room_id ON public.room_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_room_messages_sender_id ON public.room_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_room_messages_created_at ON public.room_messages(created_at DESC);
