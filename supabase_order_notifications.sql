
-- Function to handle order status change notifications
CREATE OR REPLACE FUNCTION public.handle_order_status_notification()
RETURNS TRIGGER AS $$
DECLARE
    buyer_name TEXT;
    seller_username TEXT;
    first_product_name TEXT;
    notification_content TEXT;
BEGIN
    -- Only proceed if status has changed
    IF (OLD.status IS NULL OR OLD.status <> NEW.status) THEN
        
        -- Get the seller's name (from the first item in the order)
        SELECT p.username INTO seller_username
        FROM public.order_items oi
        JOIN public.profiles p ON (
            SELECT seller_id FROM public.products WHERE id = oi.product_id
        ) = p.id
        WHERE oi.order_id = NEW.id
        LIMIT 1;

        -- Get first product name for context
        SELECT product_name INTO first_product_name
        FROM public.order_items
        WHERE order_id = NEW.id
        LIMIT 1;

        -- Define content based on status
        IF NEW.status = 'shipping' THEN
            notification_content := 'สินค้า "' || first_product_name || '" ของคุณกำลังเดินทาง! เลขพัสดุ: ' || COALESCE(NEW.tracking_number, 'กำลังรออัปเดต');
        ELSIF NEW.status = 'delivered' THEN
            notification_content := 'ผู้ขายได้จัดส่งสินค้า "' || first_product_name || '" ให้คุณแล้ว! กรุณารอรับสินค้า';
        ELSIF NEW.status = 'cancelled' THEN
            notification_content := 'คำสั่งซื้อสินค้า "' || first_product_name || '" ของคุณถูกยกเลิก';
        ELSE
            RETURN NEW; -- No notification for pending/other
        END IF;

        -- Insert notification for the buyer
        -- We use 'system' or 'gift' (as a proxy, or ideally a new type 'order')
        -- Let's use 'system' as it's safe
        INSERT INTO public.notifications (
            user_id,
            actor_id,
            type,
            content,
            is_read,
            created_at
        ) VALUES (
            NEW.buyer_id,
            COALESCE((SELECT id FROM public.profiles WHERE role = 'organizer' LIMIT 1), NEW.buyer_id), -- Proxy actor or just buyer themselves
            'system',
            notification_content,
            false,
            now()
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for order updates
DROP TRIGGER IF EXISTS on_order_status_updated ON public.orders;
CREATE TRIGGER on_order_status_updated
    AFTER UPDATE OF status ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_order_status_notification();
