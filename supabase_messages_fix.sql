-- Fix for existing messages table missing columns
-- This script ensures the messages table has the correct structure for 1:1 chat

DO $$ 
BEGIN
    -- Add sender_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='sender_id') THEN
        ALTER TABLE public.messages ADD COLUMN sender_id UUID REFERENCES public.profiles(id);
    END IF;

    -- Add receiver_id if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='receiver_id') THEN
        ALTER TABLE public.messages ADD COLUMN receiver_id UUID REFERENCES public.profiles(id);
    END IF;

    -- Add content if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='content') THEN
        ALTER TABLE public.messages ADD COLUMN content TEXT;
    END IF;

    -- Add type if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='type') THEN
        ALTER TABLE public.messages ADD COLUMN type TEXT DEFAULT 'text';
    END IF;

    -- Add is_read if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='is_read') THEN
        ALTER TABLE public.messages ADD COLUMN is_read BOOLEAN DEFAULT false;
    END IF;

    -- Add metadata if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='metadata') THEN
        ALTER TABLE public.messages ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- If the table was just created or columns were added, ensuring NOT NULL and Defaults where appropriate
-- Note: We do this separately to avoid issues if table already had data
ALTER TABLE public.messages ALTER COLUMN sender_id SET NOT NULL;
ALTER TABLE public.messages ALTER COLUMN receiver_id SET NOT NULL;

-- Fix for room_id constraint: make it nullable to support 1:1 chat
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='messages' AND column_name='room_id') THEN
        ALTER TABLE public.messages ALTER COLUMN room_id DROP NOT NULL;
    END IF;
END $$;

-- Re-apply RLS and Policies (DROP first to be safe)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
CREATE POLICY "Users can view own messages" ON public.messages 
FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
CREATE POLICY "Users can insert messages" ON public.messages 
FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can mark messages as read" ON public.messages;
CREATE POLICY "Users can mark messages as read" ON public.messages 
FOR UPDATE USING (auth.uid() = receiver_id);

-- Re-create the RPC function
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
        -- Get the latest message for each unique conversation pair
        SELECT DISTINCT ON (LEAST(m.sender_id, m.receiver_id), GREATEST(m.sender_id, m.receiver_id))
            CASE WHEN m.sender_id = auth.uid() THEN m.receiver_id ELSE m.sender_id END AS p_id,
            m.content,
            m.created_at
        FROM public.messages m
        WHERE m.sender_id = auth.uid() OR m.receiver_id = auth.uid()
        ORDER BY LEAST(m.sender_id, m.receiver_id), GREATEST(m.sender_id, m.receiver_id), m.created_at DESC
    ),
    unread_counts AS (
        -- Count unread messages where the current user is the receiver
        SELECT m2.sender_id as p_id, COUNT(*) as c
        FROM public.messages m2
        WHERE m2.receiver_id = auth.uid() AND m2.is_read = false
        GROUP BY m2.sender_id
    )
    SELECT 
        p.id as partner_id,
        p.username,
        p.avatar,
        lm.content as last_message,
        lm.created_at as last_message_time,
        COALESCE(uc.c, 0)::BIGINT as unread_count
    FROM latest_messages lm
    JOIN public.profiles p ON p.id = lm.p_id
    LEFT JOIN unread_counts uc ON uc.p_id = lm.p_id
    ORDER BY lm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
