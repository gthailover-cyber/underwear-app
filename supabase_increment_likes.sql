
-- RPC to safely increment likes for a room
CREATE OR REPLACE FUNCTION public.increment_likes(room_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.rooms
    SET likes = COALESCE(likes, 0) + 1
    WHERE id = room_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
