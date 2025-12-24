-- Add type to room_invites for tracking live confirmation
ALTER TABLE public.room_invites ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'live_session';

-- Add donation record table to track contributors (needed for refund)
CREATE TABLE IF NOT EXISTS public.room_goal_donations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    goal_id UUID REFERENCES public.room_donation_goals(id),
    user_id UUID REFERENCES public.users(id),
    amount INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS for donations
ALTER TABLE public.room_goal_donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON public.room_goal_donations FOR SELECT USING (true);
CREATE POLICY "Authenticated insert access" ON public.room_goal_donations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Migration for refund function
CREATE OR REPLACE FUNCTION public.refund_goal_donations(p_goal_id UUID)
RETURNS VOID AS $$
DECLARE
    donation RECORD;
BEGIN
    -- Loop through all donations for this goal
    FOR donation IN SELECT * FROM public.room_goal_donations WHERE goal_id = p_goal_id LOOP
        -- Refund amount to user wallet (using add_coins RPC or direct update)
        -- Assuming you have a 'profiles' or 'wallets' table with 'coins'
        UPDATE public.profiles 
        SET coins = coins + donation.amount 
        WHERE id = donation.user_id;
        
        -- Optional: Log refund or notify user
    END LOOP;

    -- Update goal status to refunded
    UPDATE public.room_donation_goals SET status = 'refunded' WHERE id = p_goal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
