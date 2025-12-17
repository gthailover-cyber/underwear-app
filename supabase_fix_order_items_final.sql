-- Comprehensive Fix for order_items table structure
DO $$
BEGIN
    -- 1. Fix Price Column Mismatch
    -- If 'price_at_purchase' exists, rename it to 'price' to match our code
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'price_at_purchase') THEN
        ALTER TABLE public.order_items RENAME COLUMN price_at_purchase TO price;
    END IF;

    -- If 'price' still doesn't exist (neither renamed nor originally there), add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'price') THEN
         ALTER TABLE public.order_items ADD COLUMN price NUMERIC DEFAULT 0;
    END IF;

    -- 2. Ensure all other required columns exist
    
    -- product_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'product_name') THEN
         ALTER TABLE public.order_items ADD COLUMN product_name TEXT;
    END IF;

    -- product_image
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'product_image') THEN
         ALTER TABLE public.order_items ADD COLUMN product_image TEXT;
    END IF;

    -- color
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'color') THEN
         ALTER TABLE public.order_items ADD COLUMN color TEXT;
    END IF;
    
    -- size
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'size') THEN
         ALTER TABLE public.order_items ADD COLUMN size TEXT;
    END IF;

    -- quantity (Ensure it has a default if we add it, though it likely exists)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'quantity') THEN
         ALTER TABLE public.order_items ADD COLUMN quantity INTEGER DEFAULT 1;
    END IF;

    -- product_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'product_id') THEN
         ALTER TABLE public.order_items ADD COLUMN product_id TEXT;
    END IF;

    -- order_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'order_id') THEN
         ALTER TABLE public.order_items ADD COLUMN order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE;
    END IF;

END $$;
