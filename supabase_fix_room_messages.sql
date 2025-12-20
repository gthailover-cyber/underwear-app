-- Fix for room messages failing due to null receiver_id
-- 0. Ensure room_id exists
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS room_id UUID;

-- 1. Make receiver_id nullable
ALTER TABLE public.messages ALTER COLUMN receiver_id DROP NOT NULL;

-- 2. Update SELECT policy to allow viewing messages in a room
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages" ON public.messages 
FOR SELECT USING (
    auth.uid() = sender_id 
    OR auth.uid() = receiver_id 
    OR room_id IS NOT NULL
);

-- 3. Ensure INSERT policy exists for room messages
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
CREATE POLICY "Users can insert messages" ON public.messages 
FOR INSERT WITH CHECK (
    auth.uid() = sender_id
);

-- 4. Add index for room_id if not exists
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON public.messages(room_id);
