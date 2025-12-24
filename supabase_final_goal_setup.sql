-- 1. Add type to room_invites if missing
ALTER TABLE public.room_invites ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'live_session';

-- 2. Create donations tracking table
CREATE TABLE IF NOT EXISTS public.room_goal_donations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    goal_id UUID REFERENCES public.room_donation_goals(id),
    user_id UUID REFERENCES auth.users(id),
    amount INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Enable RLS for donations
ALTER TABLE public.room_goal_donations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access" ON public.room_goal_donations;
CREATE POLICY "Public read access" ON public.room_goal_donations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated insert access" ON public.room_goal_donations;
CREATE POLICY "Authenticated insert access" ON public.room_goal_donations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Update donate_to_goal RPC to include insert to tracking table
CREATE OR REPLACE FUNCTION public.donate_to_goal(
    p_goal_id UUID,
    p_amount INTEGER,
    p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.room_donation_goals
    SET current_amount = current_amount + p_amount
    WHERE id = p_goal_id;

    INSERT INTO public.room_goal_donations (goal_id, user_id, amount) 
    VALUES (p_goal_id, p_user_id, p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create refund function
CREATE OR REPLACE FUNCTION public.refund_goal_donations(p_goal_id UUID)
RETURNS VOID AS $$
DECLARE
    donation RECORD;
BEGIN
    -- Loop through all donations for this goal
    FOR donation IN SELECT * FROM public.room_goal_donations WHERE goal_id = p_goal_id LOOP
        -- Refund amount to user wallet in profiles table
        -- Assumes profiles table handles coins
        UPDATE public.profiles 
        SET wallet_balance = wallet_balance + donation.amount 
        WHERE id = donation.user_id;
    END LOOP;

    -- Update goal status to refunded
    UPDATE public.room_donation_goals SET status = 'refunded' WHERE id = p_goal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
