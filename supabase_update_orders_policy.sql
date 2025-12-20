
-- 1. Ensure the helper function exists (already added, but good to keep it here for context)
CREATE OR REPLACE FUNCTION public.is_order_seller(order_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.products p ON oi.product_id = p.id
    WHERE oi.order_id = order_uuid
    AND p.seller_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Add UPDATE policy for sellers to handle status and tracking number
-- We allow update if the user is the seller of at least one item in the order
DROP POLICY IF EXISTS "Sellers can update orders containing their products" ON public.orders;
CREATE POLICY "Sellers can update orders containing their products"
ON public.orders FOR UPDATE
USING (
    public.is_order_seller(id)
)
WITH CHECK (
    public.is_order_seller(id)
);

-- 3. Also ensure users (buyers) can't update orders once placed (security)
-- or maybe they can cancelled? For now, let's keep it restricted to sellers/admins for status changes
