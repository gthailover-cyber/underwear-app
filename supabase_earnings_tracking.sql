-- Update order_items to include seller_id and item_type for easier earnings tracking
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'seller_id') THEN
        ALTER TABLE public.order_items ADD COLUMN seller_id UUID REFERENCES public.profiles(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'item_type') THEN
        ALTER TABLE public.order_items ADD COLUMN item_type TEXT DEFAULT 'normal' CHECK (item_type IN ('normal', 'auction'));
    END IF;
END $$;

-- Policies for Models to see their own earnings
DROP POLICY IF EXISTS "Sellers can view their own order items" ON public.order_items;
CREATE POLICY "Sellers can view their own order items" 
ON public.order_items FOR SELECT 
USING (auth.uid() = seller_id);

-- Backfill seller_id for existing items if possible (by joining with products)
UPDATE public.order_items oi
SET seller_id = p.seller_id,
    item_type = p.type
FROM public.products p
WHERE oi.product_id = p.id::text
AND oi.seller_id IS NULL;
