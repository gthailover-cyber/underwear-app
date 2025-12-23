
-- Version 5: ลบสินค้าประมูลอัตโนมัติ (Trigger-based deletion)
-- รันไฟล์นี้ใน Supabase SQL Editor

-- 1. ตรวจสอบและเพิ่มคอลัมน์ item_type ในตาราง order_items หากยังไม่มี
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'item_type') THEN
        ALTER TABLE public.order_items ADD COLUMN item_type TEXT DEFAULT 'normal';
    END IF;
END $$;

-- 2. สร้างฟังก์ชัน Trigger ใหม่
CREATE OR REPLACE FUNCTION update_product_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
    -- ตรวจสอบว่ามี product_id หรือไม่
    IF NEW.product_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- A. กรณีที่เป็นสินค้าประมูล (Auction) ให้ทำการ ลบ ทันทีที่ขายได้
    -- (สินค้าประมูลมีชิ้นเดียว เมื่อขายแล้วต้องหายไปจากระบบ)
    IF NEW.item_type = 'auction' THEN
        DELETE FROM public.products WHERE id::text = NEW.product_id::text;
        -- ลบ variants ที่เกี่ยวข้องด้วย
        DELETE FROM public.product_variants WHERE product_id::text = NEW.product_id::text;
        
        RAISE NOTICE 'Auction item % deleted from products table', NEW.product_id;
    
    -- B. กรณีสินค้าปกติ ให้ลด Stock และเพิ่ม Sold ตามปกติ
    ELSE
        UPDATE public.products
        SET 
            stock = GREATEST(0, stock - NEW.quantity),
            sold = COALESCE(sold, 0) + NEW.quantity
        WHERE id::text = NEW.product_id::text;

        -- อัพเดทตาราง product_variants (หากมีระบุ Color และ Size)
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

-- 3. Re-create Trigger
DROP TRIGGER IF EXISTS trigger_update_product_stock_on_order ON public.order_items;

CREATE TRIGGER trigger_update_product_stock_on_order
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION update_product_stock_on_order();

-- 4. ตั้งค่าให้ Realtime แจ้งเตือนเมื่อข้อมูลมีการเปลี่ยนแปลง (รวมถึง DELETE)
ALTER TABLE public.products REPLICA IDENTITY FULL;
