-- Create messages table for 1:1 chat
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) NOT NULL,
    content TEXT,
    type TEXT DEFAULT 'text', -- 'text', 'image', 'live_share'
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only see messages they sent or received
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages" ON public.messages 
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Authenticated users can send messages
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
CREATE POLICY "Users can insert messages" ON public.messages 
FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Mark as read: Receiver can mark messages as read
DROP POLICY IF EXISTS "Users can mark messages as read" ON public.messages;
CREATE POLICY "Users can mark messages as read" ON public.messages 
FOR UPDATE USING (auth.uid() = receiver_id);

-- Create an index for performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages (sender_id, receiver_id);

-- RPC for fetching conversations list efficiently
CREATE OR REPLACE FUNCTION public.get_conversations()
RETURNS TABLE (
    partner_id UUID,
    username TEXT,
    avatar TEXT,
    last_message TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE,
    unread_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH latest_messages AS (
        SELECT DISTINCT ON (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id))
            CASE WHEN m.sender_id = auth.uid() THEN m.receiver_id ELSE m.sender_id END AS p_id,
            m.content,
            m.created_at
        FROM public.messages m
        WHERE m.sender_id = auth.uid() OR m.receiver_id = auth.uid()
        ORDER BY LEAST(m.sender_id, m.receiver_id), GREATEST(m.sender_id, m.receiver_id), m.created_at DESC
    ),
    unread_counts AS (
        SELECT m2.sender_id as p_id, COUNT(*) as c
        FROM public.messages m2
        WHERE m2.receiver_id = auth.uid() AND m2.is_read = false
        GROUP BY m2.sender_id
    )
    SELECT 
        p.id,
        p.username,
        p.avatar,
        lm.content,
        lm.created_at,
        COALESCE(uc.c, 0)
    FROM latest_messages lm
    JOIN public.profiles p ON p.id = lm.p_id
    LEFT JOIN unread_counts uc ON uc.p_id = lm.p_id
    ORDER BY lm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Realtime for messages table
-- Note: In the Supabase dashboard, you must also ensure the table is in the 'supabase_realtime' publication.
-- This SQL attempt to add it if the publication exists.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
END $$;
