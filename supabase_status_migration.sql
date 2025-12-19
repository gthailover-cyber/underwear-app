-- Add last_seen_at column to profiles table for online/offline status
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_seen_at') THEN
        ALTER TABLE public.profiles ADD COLUMN last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
    END IF;
END $$;

-- Create an index to quickly find online users
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen_at);

-- RPC function to update user's online status (heartbeat)
CREATE OR REPLACE FUNCTION public.update_last_seen()
RETURNS void AS $$
BEGIN
    UPDATE public.profiles
    SET last_seen_at = timezone('utc'::text, now())
    WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
