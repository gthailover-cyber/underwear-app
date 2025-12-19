-- Drop table if exists to recreate properly
DROP TABLE IF EXISTS public.received_gifts;

-- Create table with explicit references to public.profiles for easier joining
CREATE TABLE public.received_gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id),
    receiver_id UUID NOT NULL REFERENCES public.profiles(id),
    gift_id TEXT NOT NULL,
    gift_name TEXT NOT NULL,
    gift_icon TEXT NOT NULL,
    price INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.received_gifts ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see gifts they received (Model seeing their earnings)
CREATE POLICY "Users can view their received gifts" 
ON public.received_gifts FOR SELECT 
USING (auth.uid() = receiver_id);

-- Policy: Users can see gifts they sent
CREATE POLICY "Users can view their sent gifts" 
ON public.received_gifts FOR SELECT 
USING (auth.uid() = sender_id);

-- Policy: Authenticated users can insert gifts
CREATE POLICY "Authenticated users can send gifts" 
ON public.received_gifts FOR INSERT 
WITH CHECK (auth.uid() = sender_id);
