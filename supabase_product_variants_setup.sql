
-- 1. Create table for product variants
CREATE TABLE IF NOT EXISTS public.product_variants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    color TEXT,
    size TEXT,
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add indices for performance
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);

-- 3. Enable RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- 4. Policies
DROP POLICY IF EXISTS "Variants are viewable by everyone" ON public.product_variants;
CREATE POLICY "Variants are viewable by everyone" ON public.product_variants 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Sellers can manage variants of their own products" ON public.product_variants;
CREATE POLICY "Sellers can manage variants of their own products" ON public.product_variants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.products
            WHERE products.id = product_variants.product_id
            AND products.seller_id = auth.uid()
        )
    );

-- 5. Add variants to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.product_variants;
