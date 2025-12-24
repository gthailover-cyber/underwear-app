-- Function to handle donations: updates goal progress and records the donation
CREATE OR REPLACE FUNCTION public.donate_to_goal(
    p_goal_id UUID,
    p_amount INTEGER,
    p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
    -- 1. Increment the current_amount in room_donation_goals
    UPDATE public.room_donation_goals
    SET current_amount = current_amount + p_amount
    WHERE id = p_goal_id;

    -- 2. Insert into donations history table for refund tracking
    INSERT INTO public.room_goal_donations (goal_id, user_id, amount) 
    VALUES (p_goal_id, p_user_id, p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
