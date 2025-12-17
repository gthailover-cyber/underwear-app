-- Resolve column conflict in order_items
DO $$
BEGIN
    -- 1. Drop 'price_at_purchase' to remove the Not-Null constraint error
    -- We use 'price' in our code, and 'price' column already exists (as per the error message)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'price_at_purchase') THEN
        ALTER TABLE public.order_items DROP COLUMN price_at_purchase;
    END IF;

    -- 2. Ensure 'price' exists (though error said it does, good to be safe)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'price') THEN
        ALTER TABLE public.order_items ADD COLUMN price NUMERIC DEFAULT 0;
    END IF;

    -- 3. Ensure other columns exist (Just verifying)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'product_image') THEN
         ALTER TABLE public.order_items ADD COLUMN product_image TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'product_name') THEN
         ALTER TABLE public.order_items ADD COLUMN product_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'color') THEN
         ALTER TABLE public.order_items ADD COLUMN color TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'size') THEN
         ALTER TABLE public.order_items ADD COLUMN size TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'product_id') THEN
         ALTER TABLE public.order_items ADD COLUMN product_id TEXT;
    END IF;
END $$;
