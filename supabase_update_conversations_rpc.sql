
-- Update get_conversations RPC to include role
DROP FUNCTION IF EXISTS public.get_conversations();
CREATE OR REPLACE FUNCTION public.get_conversations()
RETURNS TABLE (
    partner_id UUID,
    username TEXT,
    avatar TEXT,
    role TEXT,
    last_message TEXT,
    last_message_time TIMESTAMP WITH TIME ZONE,
    unread_count BIGINT,
    last_seen_at TIMESTAMP WITH TIME ZONE
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
        p.role::TEXT,
        lm.content as last_message,
        lm.created_at as last_message_time,
        COALESCE(uc.c, 0)::BIGINT as unread_count,
        p.last_seen_at
    FROM latest_messages lm
    JOIN public.profiles p ON p.id = lm.p_id
    LEFT JOIN unread_counts uc ON uc.p_id = lm.p_id
    ORDER BY lm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
