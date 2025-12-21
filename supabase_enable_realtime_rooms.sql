-- Enable Realtime for chat rooms tables
-- Run this in Supabase SQL Editor

-- 1. Enable realtime for room_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;

-- 2. Enable realtime for room_members table
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members;

-- 3. Enable realtime for chat_rooms table (for member count updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms;
