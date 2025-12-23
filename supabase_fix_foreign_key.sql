
-- Fix: Remove Foreign Key constraint that prevents deleting auction products
-- รันไฟล์นี้ใน Supabase SQL Editor

-- 1. ลบ Foreign Key constraint ออกเพื่อให้เราสามารถลบสินค้า (โดยเฉพาะสินค้าประมูล) 
-- โดยที่ข้อมูลในประวัติการสั่งซื้อ (order_items) ยังคงอยู่ได้
ALTER TABLE public.order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

-- 2. เพื่อความปลอดภัย เราตรวจสอบความถูกต้องของ Trigger อีกครั้ง
-- (ให้แน่ใจว่าใช้ Version 5 ล่าสุด)
CREATE OR REPLACE FUNCTION update_product_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.product_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- กรณีที่เป็นสินค้าประมูล (Auction) ให้ทำการ ลบ ทันทีที่ขายได้
    IF NEW.item_type = 'auction' THEN
        -- ลบ variants ก่อน (ถ้ามี)
        DELETE FROM public.product_variants WHERE product_id::text = NEW.product_id::text;
        -- ลบสินค้าหลัก
        DELETE FROM public.products WHERE id::text = NEW.product_id::text;
        
        RAISE NOTICE 'Auction item % deleted from products table', NEW.product_id;
    
    -- กรณีสินค้าปกติ
    ELSE
        UPDATE public.products
        SET 
            stock = GREATEST(0, stock - NEW.quantity),
            sold = COALESCE(sold, 0) + NEW.quantity
        WHERE id::text = NEW.product_id::text;

        IF NEW.color IS NOT NULL AND NEW.size IS NOT NULL THEN
            UPDATE public.product_variants
            SET stock = GREATEST(0, stock - NEW.quantity)
            WHERE product_id::text = NEW.product_id::text
            AND color = NEW.color
            AND size = NEW.size;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
