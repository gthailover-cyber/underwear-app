
-- Ensure products and product_variants are in the realtime publication
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'products'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'product_variants'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.product_variants;
    END IF;
END $$;

-- Set replica identity to FULL to ensure all columns are sent in updates
-- This is often necessary for filters to work reliably in some environments
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.product_variants REPLICA IDENTITY FULL;
