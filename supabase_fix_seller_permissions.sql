
-- 1. Fix RLS for orders table to allow sellers/models to see orders containing their products
DROP POLICY IF EXISTS "Sellers can view orders containing their products" ON public.orders;
CREATE POLICY "Sellers can view orders containing their products"
ON public.orders FOR SELECT
USING (
    auth.uid() = buyer_id 
    OR 
    EXISTS (
        SELECT 1 FROM public.order_items
        JOIN public.products ON order_items.product_id = products.id
        WHERE order_items.order_id = orders.id
        AND products.seller_id = auth.uid()
    )
);

-- 2. Ensure order_items has RLS and appropriate policies
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view relevant order items" ON public.order_items;
CREATE POLICY "Users can view relevant order items"
ON public.order_items FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = order_items.order_id
        AND (orders.buyer_id = auth.uid() OR EXISTS (
            SELECT 1 FROM public.products
            WHERE products.id = order_items.product_id
            AND products.seller_id = auth.uid()
        ))
    )
);

-- 3. Ensure foreign keys exist for automatic joins in Supabase/PostgREST
-- This helps the 'products!inner' and 'orders!inner' joins work correctly

DO $$
BEGIN
    -- Fix product_id foreign key if it's missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_items_product_id_fkey'
    ) THEN
        -- If it was added as TEXT, we might need to cast or recreate
        -- For safety, we try to add the constraint assuming UUID
        BEGIN
            ALTER TABLE public.order_items 
            ALTER COLUMN product_id TYPE UUID USING product_id::UUID;
            
            ALTER TABLE public.order_items
            ADD CONSTRAINT order_items_product_id_fkey 
            FOREIGN KEY (product_id) REFERENCES public.products(id);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not add product_id foreign key automatically. Please check if product_id contains valid UUIDs.';
        END;
    END IF;
END $$;
