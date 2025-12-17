-- Ensure all necessary columns exist in order_items
DO $$
BEGIN
    -- Check and add product_image
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'product_image') THEN
        ALTER TABLE public.order_items ADD COLUMN product_image TEXT;
    END IF;

    -- Check and add product_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'product_name') THEN
        ALTER TABLE public.order_items ADD COLUMN product_name TEXT;
    END IF;

    -- Check and add color
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'color') THEN
        ALTER TABLE public.order_items ADD COLUMN color TEXT;
    END IF;

    -- Check and add size
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'size') THEN
        ALTER TABLE public.order_items ADD COLUMN size TEXT;
    END IF;
    
    -- Check and add price (redundant check but safe)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'price') THEN
        ALTER TABLE public.order_items ADD COLUMN price NUMERIC NOT NULL DEFAULT 0;
    END IF;
END $$;
