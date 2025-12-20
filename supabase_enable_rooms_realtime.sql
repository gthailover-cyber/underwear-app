-- Enable Realtime for rooms table to sync bids and viewer counts globally
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'rooms') THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
        END IF;
    END IF;
END $$;
