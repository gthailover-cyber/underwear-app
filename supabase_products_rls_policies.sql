-- Enable RLS on products table if not already enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view all products" ON public.products;
DROP POLICY IF EXISTS "Sellers can manage their own products" ON public.products;
DROP POLICY IF EXISTS "Sellers can insert their own products" ON public.products;
DROP POLICY IF EXISTS "Sellers can update their own products" ON public.products;
DROP POLICY IF EXISTS "Sellers can delete their own products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Models can manage products" ON public.products;

-- Policy: Anyone can view products
CREATE POLICY "Users can view all products" 
ON public.products FOR SELECT 
USING (true);

-- Policy: Sellers can insert their own products
CREATE POLICY "Sellers can insert their own products" 
ON public.products FOR INSERT 
WITH CHECK (auth.uid() = seller_id);

-- Policy: Sellers can update their own products
CREATE POLICY "Sellers can update their own products" 
ON public.products FOR UPDATE 
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);

-- Policy: Sellers can delete their own products
CREATE POLICY "Sellers can delete their own products" 
ON public.products FOR DELETE 
USING (auth.uid() = seller_id);
