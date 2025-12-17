-- Ensure price column exists in order_items
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'price') THEN
        ALTER TABLE public.order_items ADD COLUMN price NUMERIC NOT NULL DEFAULT 0;
    END IF;
END $$;
