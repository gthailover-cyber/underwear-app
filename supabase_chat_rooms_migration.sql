-- Create chat_rooms table for group chat functionality
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image TEXT,
  type TEXT NOT NULL CHECK (type IN ('public', 'private')),
  host_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  host_name TEXT NOT NULL,
  members INTEGER DEFAULT 1,
  last_message TEXT,
  last_message_time TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view public rooms
CREATE POLICY "Public rooms are viewable by everyone"
  ON public.chat_rooms
  FOR SELECT
  USING (type = 'public' OR auth.uid() = host_id);

-- Policy: Authenticated users can create rooms
CREATE POLICY "Authenticated users can create rooms"
  ON public.chat_rooms
  FOR INSERT
  WITH CHECK (auth.uid() = host_id);

-- Policy: Room hosts can update their rooms
CREATE POLICY "Room hosts can update their rooms"
  ON public.chat_rooms
  FOR UPDATE
  USING (auth.uid() = host_id);

-- Policy: Room hosts can delete their rooms
CREATE POLICY "Room hosts can delete their rooms"
  ON public.chat_rooms
  FOR DELETE
  USING (auth.uid() = host_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_rooms_host_id ON public.chat_rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_type ON public.chat_rooms(type);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_created_at ON public.chat_rooms(created_at DESC);

-- Create room_members table for tracking room participants
CREATE TABLE IF NOT EXISTS public.room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- Enable RLS on room_members
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view members of rooms they're in
CREATE POLICY "Users can view room members"
  ON public.room_members
  FOR SELECT
  USING (
    user_id = auth.uid() OR 
    room_id IN (SELECT id FROM public.chat_rooms WHERE host_id = auth.uid())
  );

-- Policy: Users can join rooms
CREATE POLICY "Users can join rooms"
  ON public.room_members
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Policy: Users can leave rooms
CREATE POLICY "Users can leave rooms"
  ON public.room_members
  FOR DELETE
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON public.room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON public.room_members(user_id);

-- Function to update member count when someone joins/leaves
CREATE OR REPLACE FUNCTION update_room_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.chat_rooms
    SET members = members + 1
    WHERE id = NEW.room_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.chat_rooms
    SET members = members - 1
    WHERE id = OLD.room_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_room_member_count ON public.room_members;
CREATE TRIGGER trigger_update_room_member_count
  AFTER INSERT OR DELETE ON public.room_members
  FOR EACH ROW
  EXECUTE FUNCTION update_room_member_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_chat_rooms_updated_at ON public.chat_rooms;
CREATE TRIGGER trigger_update_chat_rooms_updated_at
  BEFORE UPDATE ON public.chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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
