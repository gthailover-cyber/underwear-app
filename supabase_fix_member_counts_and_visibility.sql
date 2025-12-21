-- 1. Update the member count function to handle status and updates
CREATE OR REPLACE FUNCTION public.update_room_member_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert: Increment ONLY if approved
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'approved' THEN
      UPDATE public.chat_rooms SET members = members + 1 WHERE id = NEW.room_id;
    END IF;
    
  -- Delete: Decrement ONLY if it was approved
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'approved' THEN
      UPDATE public.chat_rooms SET members = members - 1 WHERE id = OLD.room_id;
    END IF;
    
  -- Update: Handle transition
  ELSIF TG_OP = 'UPDATE' THEN
    IF (OLD.status = 'pending' OR OLD.status IS NULL) AND NEW.status = 'approved' THEN
      UPDATE public.chat_rooms SET members = members + 1 WHERE id = NEW.room_id;
    ELSIF OLD.status = 'approved' AND (NEW.status = 'pending' OR NEW.status IS NULL) THEN
      UPDATE public.chat_rooms SET members = members - 1 WHERE id = NEW.room_id;
    END IF;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update the trigger to include UPDATE events
DROP TRIGGER IF EXISTS trigger_update_room_member_count ON public.room_members;
CREATE TRIGGER trigger_update_room_member_count
  AFTER INSERT OR DELETE OR UPDATE ON public.room_members
  FOR EACH ROW
  EXECUTE FUNCTION update_room_member_count();

-- 3. Update RLS to allow all users to see approved members
DROP POLICY IF EXISTS "Users can view room members" ON public.room_members;
CREATE POLICY "Users can view room members"
  ON public.room_members
  FOR SELECT
  USING (
    status = 'approved' OR
    room_id IN (SELECT id FROM public.chat_rooms WHERE host_id = auth.uid()) OR
    user_id = auth.uid()
  );

-- 4. Recalculate current member counts for all rooms to ensure accuracy
UPDATE public.chat_rooms r
SET members = (
  SELECT count(*) 
  FROM public.room_members m 
  WHERE m.room_id = r.id AND m.status = 'approved'
);
