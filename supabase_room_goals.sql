-- Create table for room donation goals
CREATE TABLE IF NOT EXISTS public.room_donation_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_amount INTEGER NOT NULL,
    current_amount INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Enable RLS
ALTER TABLE public.room_donation_goals ENABLE ROW LEVEL SECURITY;

-- Policies for room_donation_goals
CREATE POLICY "Anyone can view room goals"
    ON public.room_donation_goals FOR SELECT
    USING (true);

CREATE POLICY "Hosts can create room goals"
    ON public.room_donation_goals FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT host_id FROM public.chat_rooms WHERE id = room_id
    ));

CREATE POLICY "Hosts can update room goals"
    ON public.room_donation_goals FOR UPDATE
    USING (auth.uid() IN (
        SELECT host_id FROM public.chat_rooms WHERE id = room_id
    ));

-- Create table for invites (optional for now, but good structure)
CREATE TABLE IF NOT EXISTS public.room_invites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE public.room_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hosts can create invites"
    ON public.room_invites FOR INSERT
    WITH CHECK (auth.uid() IN (
        SELECT host_id FROM public.chat_rooms WHERE id = room_id
    ));
    
CREATE POLICY "Models can view their invites"
    ON public.room_invites FOR SELECT
    USING (auth.uid() = model_id);

CREATE POLICY "Models can update their invites"
    ON public.room_invites FOR UPDATE
    USING (auth.uid() = model_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_donation_goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_invites;
