-- Fixed: Trigger with unique variable names to avoid ambiguity
CREATE OR REPLACE FUNCTION public.handle_room_approval_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_room_name TEXT;
    v_room_image TEXT;
    v_host_id UUID;
BEGIN
    -- Check if status changed from 'pending' to 'approved'
    IF (OLD.status = 'pending' AND NEW.status = 'approved') THEN
        -- Get room info
        SELECT name, image, host_id 
        INTO v_room_name, v_room_image, v_host_id 
        FROM public.chat_rooms 
        WHERE id = NEW.room_id;
        
        -- Insert notification
        INSERT INTO public.notifications (
            user_id, 
            actor_id, 
            type, 
            content, 
            image_url,
            is_read,
            created_at
        )
        VALUES (
            NEW.user_id, 
            v_host_id, 
            'room_approval', 
            'อนุมัติการเข้าห้อง "' || COALESCE(v_room_name, 'ห้องส่วนตัว') || '" แล้ว',
            v_room_image,
            false,
            now()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_room_approval_notification ON public.room_members;
CREATE TRIGGER on_room_approval_notification
AFTER UPDATE ON public.room_members
FOR EACH ROW EXECUTE FUNCTION public.handle_room_approval_notification();
