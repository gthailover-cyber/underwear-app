
-- Trigger to update product stock and sold count when an order item is created
-- This ensures that stock is decremented and sold count is incremented automatically
-- whenever a payment is successful and items are added to order_items.

CREATE OR REPLACE FUNCTION update_product_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the products table
    -- We assume NEW.product_id is a UUID or TEXT that matches products.id
    UPDATE public.products
    SET 
        stock = GREATEST(0, stock - NEW.quantity), -- Ensure stock doesn't go below 0
        sold = COALESCE(sold, 0) + NEW.quantity
    WHERE id = NEW.product_id::UUID; -- Casting to UUID just in case it's passed as TEXT
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_product_stock_on_order ON public.order_items;

-- Create the trigger
CREATE TRIGGER trigger_update_product_stock_on_order
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION update_product_stock_on_order();

-- Optional: Add a check for insufficient stock if we want to prevent overselling at DB level
-- For now, we allow it but clamp at 0 to keep it simple as requested.
