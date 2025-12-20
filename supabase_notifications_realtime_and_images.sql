
-- 1. Add image_url column to notifications table
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Update the handle_order_status_notification function to include product image
CREATE OR REPLACE FUNCTION public.handle_order_status_notification()
RETURNS TRIGGER AS $$
DECLARE
    first_product_name TEXT;
    first_product_image TEXT;
    notification_content TEXT;
BEGIN
    -- Only proceed if status has changed
    IF (OLD.status IS NULL OR OLD.status <> NEW.status) THEN
        
        -- Get the first item's name and image in the order
        SELECT product_name, product_image INTO first_product_name, first_product_image
        FROM public.order_items
        WHERE order_id = NEW.id
        LIMIT 1;

        -- Define content based on status
        IF NEW.status = 'shipping' THEN
            notification_content := 'สินค้า "' || first_product_name || '" ของคุณถูกจัดส่งแล้ว! เลขพัสดุ: ' || COALESCE(NEW.tracking_number, 'กำลังอัปเดต');
        ELSIF NEW.status = 'delivered' THEN
            notification_content := 'สินค้า "' || first_product_name || '" ถูกจัดส่งถึงมือคุณเรียบร้อยแล้ว ขอบคุณที่ใช้บริการครับ';
        ELSIF NEW.status = 'cancelled' THEN
            notification_content := 'คำสั่งซื้อสินค้า "' || first_product_name || '" ของคุณถูกยกเลิก';
        ELSE
            RETURN NEW; 
        END IF;

        -- Insert notification for the buyer
        INSERT INTO public.notifications (
            user_id,
            actor_id,
            type,
            content,
            image_url,
            is_read,
            created_at
        ) VALUES (
            NEW.buyer_id,
            COALESCE((SELECT id FROM public.profiles WHERE role = 'organizer' LIMIT 1), NEW.buyer_id),
            'system',
            notification_content,
            first_product_image,
            false,
            now()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure notifications are in real-time publication
-- First, check if the table is already in the publication, if not add it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND schemaname = 'public' 
            AND tablename = 'notifications'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
        END IF;
    END IF;

    -- Also add orders if not there (for tracking status updates)
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'orders'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    END IF;
END $$;
