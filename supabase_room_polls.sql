-- Create table for Room Polls
CREATE TABLE IF NOT EXISTS public.room_polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
    host_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    model_ids UUID[] NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for Poll Votes
CREATE TABLE IF NOT EXISTS public.room_poll_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID REFERENCES public.room_polls(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    model_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(poll_id, user_id)
);

-- Enable RLS
ALTER TABLE public.room_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_poll_votes ENABLE ROW LEVEL SECURITY;

-- Policies for room_polls
CREATE POLICY "Anyone can view active polls" 
ON public.room_polls FOR SELECT 
USING (true);

CREATE POLICY "Hosts can create polls" 
ON public.room_polls FOR INSERT 
WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can end their polls" 
ON public.room_polls FOR UPDATE 
USING (auth.uid() = host_id);

-- Policies for room_poll_votes
CREATE POLICY "Anyone can view votes" 
ON public.room_poll_votes FOR SELECT 
USING (true);

CREATE POLICY "Members can vote once per poll" 
ON public.room_poll_votes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_polls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_poll_votes;
