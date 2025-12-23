-- Fix product_variants RLS policies to allow proper INSERT, UPDATE, DELETE operations

-- Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Variants are viewable by everyone" ON public.product_variants;
DROP POLICY IF EXISTS "Sellers can manage variants of their own products" ON public.product_variants;
DROP POLICY IF EXISTS "Sellers can insert variants" ON public.product_variants;
DROP POLICY IF EXISTS "Sellers can update variants" ON public.product_variants;
DROP POLICY IF EXISTS "Sellers can delete variants" ON public.product_variants;

-- Policy: Everyone can view variants
CREATE POLICY "Variants are viewable by everyone" 
ON public.product_variants FOR SELECT 
USING (true);

-- Policy: Sellers can insert variants for their own products
CREATE POLICY "Sellers can insert variants" 
ON public.product_variants FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.products
        WHERE products.id = product_variants.product_id
        AND products.seller_id = auth.uid()
    )
);

-- Policy: Sellers can update variants of their own products
CREATE POLICY "Sellers can update variants" 
ON public.product_variants FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.products
        WHERE products.id = product_variants.product_id
        AND products.seller_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.products
        WHERE products.id = product_variants.product_id
        AND products.seller_id = auth.uid()
    )
);

-- Policy: Sellers can delete variants of their own products
CREATE POLICY "Sellers can delete variants" 
ON public.product_variants FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.products
        WHERE products.id = product_variants.product_id
        AND products.seller_id = auth.uid()
    )
);
