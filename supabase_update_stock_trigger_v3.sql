
-- Version 3: ปรองดองกับระบบ Variants (สี/ไซส์)
CREATE OR REPLACE FUNCTION update_product_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. อัพเดทตาราง products (Stock รวม และ Sold รวม)
    UPDATE public.products
    SET 
        stock = GREATEST(0, stock - NEW.quantity),
        sold = COALESCE(sold, 0) + NEW.quantity
    WHERE id::text = NEW.product_id::text;

    -- 2. อัพเดทตาราง product_variants (Stock รายสี/ไซส์)
    -- ถ้ามีสีและไซส์ระบุมาใน order_item
    IF NEW.color IS NOT NULL AND NEW.size IS NOT NULL THEN
        UPDATE public.product_variants
        SET stock = GREATEST(0, stock - NEW.quantity)
        WHERE product_id::text = NEW.product_id::text
        AND color = NEW.color
        AND size = NEW.size;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ลบและสร้าง Trigger ใหม่
DROP TRIGGER IF EXISTS trigger_update_product_stock_on_order ON public.order_items;

CREATE TRIGGER trigger_update_product_stock_on_order
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION update_product_stock_on_order();
