-- Create follows table
CREATE TABLE IF NOT EXISTS public.follows (
    follower_id UUID REFERENCES public.profiles(id) NOT NULL,
    followed_id UUID REFERENCES public.profiles(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (follower_id, followed_id)
);

-- Enable RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Policies
-- Anyone can see who is following whom (to display counts accurately)
DROP POLICY IF EXISTS "Anyone can view follows" ON public.follows;
CREATE POLICY "Anyone can view follows" ON public.follows FOR SELECT USING (true);

-- Authenticated users can follow others
DROP POLICY IF EXISTS "Authenticated users can follow" ON public.follows;
CREATE POLICY "Authenticated users can follow" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Authenticated users can unfollow
DROP POLICY IF EXISTS "Authenticated users can unfollow" ON public.follows;
CREATE POLICY "Authenticated users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Function to update followers/following counts
CREATE OR REPLACE FUNCTION public.handle_follow_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Increment followers for the followed user
        UPDATE public.profiles 
        SET followers = COALESCE(followers, 0) + 1 
        WHERE id = NEW.followed_id;
        
        -- Increment following for the follower
        UPDATE public.profiles 
        SET following = COALESCE(following, 0) + 1 
        WHERE id = NEW.follower_id;
        
    ELSIF (TG_OP = 'DELETE') THEN
        -- Decrement followers for the followed user
        UPDATE public.profiles 
        SET followers = GREATEST(COALESCE(followers, 0) - 1, 0) 
        WHERE id = OLD.followed_id;
        
        -- Decrement following for the follower
        UPDATE public.profiles 
        SET following = GREATEST(COALESCE(following, 0) - 1, 0) 
        WHERE id = OLD.follower_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for follow stats
DROP TRIGGER IF EXISTS on_follow_stat_change ON public.follows;
CREATE TRIGGER on_follow_stat_change
AFTER INSERT OR DELETE ON public.follows
FOR EACH ROW EXECUTE FUNCTION public.handle_follow_stats();
