-- Function to handle donations: updates goal progress and records the donation
-- Assumes wallet deduction is handled separately or we add logic here if we have a wallet table
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

    -- 2. Optional: Insert into a donations history table if you have one
    -- INSERT INTO public.donations (user_id, room_goal_id, amount) VALUES (p_user_id, p_goal_id, p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.donate_to_goal(UUID, INTEGER, UUID) TO authenticated;
