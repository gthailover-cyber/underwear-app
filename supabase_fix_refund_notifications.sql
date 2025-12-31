
-- FIX: Add missing columns and improve refund/payout functions

-- 1. Ensure 'metadata' column exists in notifications table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'metadata') THEN
        ALTER TABLE public.notifications ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 2. Ensure 'goal_id' column exists in rooms table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'rooms' AND column_name = 'goal_id') THEN
        ALTER TABLE public.rooms ADD COLUMN goal_id UUID REFERENCES public.room_donation_goals(id);
    END IF;
END $$;

-- 3. Optimized Payout function
CREATE OR REPLACE FUNCTION public.payout_goal_donations(p_goal_id UUID, p_model_id UUID)
RETURNS VOID AS $$
DECLARE
    donation RECORD;
    total_amount INTEGER;
    model_name TEXT;
BEGIN
    -- Get goal details
    SELECT current_amount INTO total_amount FROM public.room_donation_goals WHERE id = p_goal_id AND status = 'completed';
    SELECT username INTO model_name FROM public.profiles WHERE id = p_model_id;
    
    -- Safety check: Only pay if not already paid/refunded
    IF total_amount IS NULL OR total_amount <= 0 THEN
        RETURN;
    END IF;

    -- 1. Pay the model
    UPDATE public.profiles 
    SET wallet_balance = wallet_balance + total_amount 
    WHERE id = p_model_id;

    -- 2. Notify model
    INSERT INTO public.notifications (user_id, actor_id, type, content, metadata)
    VALUES (p_model_id, p_model_id, 'system', 
            'คุณได้รับเงิน ' || total_amount || ' coins จากการ live streaming เรียบร้อยแล้ว 🎉',
            jsonb_build_object('goal_id', p_goal_id, 'amount', total_amount, 'result', 'payout'));

    -- 3. Notify donors
    FOR donation IN 
        SELECT user_id, SUM(amount) as total_user_amount 
        FROM public.room_goal_donations 
        WHERE goal_id = p_goal_id 
        GROUP BY user_id 
    LOOP
        INSERT INTO public.notifications (user_id, actor_id, type, content, metadata)
        VALUES (donation.user_id, p_model_id, 'system', 
                'หักเงินจำนวน ' || donation.total_user_amount || ' coins ให้กับนายแบบ ' || model_name || ' (Live สำเร็จตามเวลา)',
                jsonb_build_object('goal_id', p_goal_id, 'amount', donation.total_user_amount, 'result', 'deducted'));
    END LOOP;

    -- 4. Update goal status to 'paid' (to prevent double payout/refund)
    UPDATE public.room_donation_goals SET status = 'paid' WHERE id = p_goal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Optimized Refund function
CREATE OR REPLACE FUNCTION public.refund_goal_donations(p_goal_id UUID)
RETURNS VOID AS $$
DECLARE
    donation RECORD;
    model_name TEXT;
    model_id UUID;
    v_status TEXT;
BEGIN
    -- Check goal status first
    SELECT status, model_id INTO v_status, model_id FROM public.room_donation_goals WHERE id = p_goal_id;
    IF v_status != 'completed' THEN
        RETURN; -- Already paid or refunded or still active
    END IF;

    -- Get model name
    SELECT username INTO model_name FROM public.profiles WHERE id = model_id;

    -- Loop through unique donors
    FOR donation IN 
        SELECT user_id, SUM(amount) as total_user_amount 
        FROM public.room_goal_donations 
        WHERE goal_id = p_goal_id 
        GROUP BY user_id 
    LOOP
        -- Refund to user wallet
        UPDATE public.profiles 
        SET wallet_balance = wallet_balance + donation.total_user_amount 
        WHERE id = donation.user_id;

        -- Notify donor
        INSERT INTO public.notifications (user_id, actor_id, type, content, metadata)
        VALUES (donation.user_id, model_id, 'system', 
                'เงินจำนวน ' || donation.total_user_amount || ' coins ได้รับการคืนเนื่องจาก Live ของ ' || model_name || ' สิ้นสุดก่อนกำหนด',
                jsonb_build_object('goal_id', p_goal_id, 'amount', donation.total_user_amount, 'result', 'refunded'));
    END LOOP;

    -- Update goal status to 'refunded'
    UPDATE public.room_donation_goals SET status = 'refunded' WHERE id = p_goal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
