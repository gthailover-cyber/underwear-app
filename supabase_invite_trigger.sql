-- Function to automatically create a donation goal when an invite is accepted
CREATE OR REPLACE FUNCTION public.handle_invite_accepted()
RETURNS TRIGGER AS $$
DECLARE
    model_rate INTEGER;
BEGIN
    -- Only proceed if status is changing to 'accepted'
    IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted') THEN
        
        -- 1. Get the model's live event rate
        SELECT rate_event_live INTO model_rate
        FROM public.profiles
        WHERE id = NEW.model_id;

        -- 2. Set default if no rate is set (e.g., 10,000 coins)
        IF model_rate IS NULL OR model_rate <= 0 THEN
            model_rate := 10000;
        END IF;

        -- 3. Create the donation goal with SECURITY DEFINER privileges (bypasses RLS)
        INSERT INTO public.room_donation_goals (room_id, model_id, target_amount, status)
        VALUES (NEW.room_id, NEW.model_id, model_rate, 'active');
        
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to allow re-creation
DROP TRIGGER IF EXISTS on_invite_accepted ON public.room_invites;

-- Create the trigger
CREATE TRIGGER on_invite_accepted
AFTER UPDATE ON public.room_invites
FOR EACH ROW
EXECUTE FUNCTION public.handle_invite_accepted();
