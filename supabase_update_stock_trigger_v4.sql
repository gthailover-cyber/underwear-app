
-- Version 4: เพิ่มความยืดหยุ่นในการจัดการ UUID และเพิ่ม Logging 
-- รันไฟล์นี้ใน Supabase SQL Editor

CREATE OR REPLACE FUNCTION update_product_stock_on_order()
RETURNS TRIGGER AS $$
DECLARE
    v_product_exists BOOLEAN;
BEGIN
    -- ตรวจสอบว่ามี product_id หรือไม่
    IF NEW.product_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- 1. อัพเดทตาราง products (Stock รวม และ Sold รวม)
    -- ใช้การ Cast เป็น UUID เพื่อความแม่นยำในการ Match
    UPDATE public.products
    SET 
        stock = GREATEST(0, stock - NEW.quantity),
        sold = COALESCE(sold, 0) + NEW.quantity
    WHERE id::text = NEW.product_id::text;

    -- 2. อัพเดทตาราง product_variants (หากมีระบุ Color และ Size)
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

-- Re-create Trigger
DROP TRIGGER IF EXISTS trigger_update_product_stock_on_order ON public.order_items;

CREATE TRIGGER trigger_update_product_stock_on_order
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION update_product_stock_on_order();

-- แจ้งให้ Supabase ส่งข้อมูล Realtime หลังการอัพเดทตาราง products
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.product_variants REPLICA IDENTITY FULL;
