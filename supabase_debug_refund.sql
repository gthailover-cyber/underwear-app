-- Function: refund_goal_donations(p_goal_id uuid)
-- Description: Refunds all donations associated with a specific goal back to the user's wallet_balance.
-- It iterates through 'room_goal_donations' for the given goal_id, updates the user's 'wallet_balance' in 'profiles',
-- and finally marks the 'room_donation_goals' status as 'refunded'.

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
        SET wallet_balance = COALESCE(wallet_balance, 0) + donation.amount 
        WHERE id = donation.user_id;

        -- Optional: Log transaction if you have a transactions table (recommended)
         -- INSERT INTO public.transactions (user_id, amount, type, description)
         -- VALUES (donation.user_id, donation.amount, 'refund', 'Refund for goal ' || p_goal_id);
    END LOOP;

    -- Update goal status to refunded
    UPDATE public.room_donation_goals SET status = 'refunded' WHERE id = p_goal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
