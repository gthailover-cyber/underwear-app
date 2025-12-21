-- Trigger to automatically create a notification when a room membership is approved
CREATE OR REPLACE FUNCTION public.handle_room_approval_notification()
RETURNS TRIGGER AS $$
DECLARE
    room_name TEXT;
    room_image TEXT;
    host_id UUID;
BEGIN
    -- Check if status changed from 'pending' to 'approved'
    IF (OLD.status = 'pending' AND NEW.status = 'approved') THEN
        -- Get room info
        SELECT name, image, host_id INTO room_name, room_image, host_id FROM public.chat_rooms WHERE id = NEW.room_id;
        
        -- Insert notification for the user who was approved
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
            host_id, 
            'room_approval', 
            'อนุมัติการเข้าห้อง "' || COALESCE(room_name, 'ห้องส่วนตัว') || '" แล้ว',
            room_image,
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
