-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL, -- Target user (receiver)
    actor_id UUID REFERENCES public.profiles(id) NOT NULL, -- User who triggered it (follower, liker, etc)
    type TEXT NOT NULL, -- 'follow', 'gift', 'message', etc
    content TEXT, -- Human-readable content or JSON
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only see their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications 
FOR SELECT USING (auth.uid() = user_id);

-- System can insert notifications (via triggers)
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "System can insert notifications" ON public.notifications 
FOR INSERT WITH CHECK (true); -- Usually restricted to service role or specific triggers but for simplicity here...

-- Users can delete their notifications (optional)
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" ON public.notifications 
FOR DELETE USING (auth.uid() = user_id);

-- Users can update (mark as read) their notifications
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications 
FOR UPDATE USING (auth.uid() = user_id);

-- Function to handle follow notifications
CREATE OR REPLACE FUNCTION public.handle_follow_notification()
RETURNS TRIGGER AS $$
DECLARE
    follower_name TEXT;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Get follower name for the notification content
        SELECT username INTO follower_name FROM public.profiles WHERE id = NEW.follower_id;
        
        -- Insert follow notification
        INSERT INTO public.notifications (user_id, actor_id, type, content)
        VALUES (
            NEW.followed_id, 
            NEW.follower_id, 
            'follow', 
            COALESCE(follower_name, 'Someone') || ' started following you'
        );
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for follow notifications
DROP TRIGGER IF EXISTS on_follow_notification ON public.follows;
CREATE TRIGGER on_follow_notification
AFTER INSERT ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.handle_follow_notification();
