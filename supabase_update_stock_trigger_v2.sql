
-- Version 2: ปรับปรุงให้มีสิทธิ์สูงสุด (SECURITY DEFINER) เพื่อข้าม RLS
CREATE OR REPLACE FUNCTION update_product_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
    -- อัพเดทตาราง products โดยตรง
    UPDATE public.products
    SET 
        stock = GREATEST(0, stock - NEW.quantity),
        sold = COALESCE(sold, 0) + NEW.quantity
    WHERE id::text = NEW.product_id::text; -- เทียบเป็น text เพื่อป้องกันปัญหาประเภทข้อมูล UUID/TEXT
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- สำคัญมาก: เพื่อให้รันในชื่อ owner ที่มีสิทธิ์แก้ตาราง product

-- ลบและสร้าง Trigger ใหม่
DROP TRIGGER IF EXISTS trigger_update_product_stock_on_order ON public.order_items;

CREATE TRIGGER trigger_update_product_stock_on_order
AFTER INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION update_product_stock_on_order();
