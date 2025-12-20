-- Add product_ids column to rooms table to track selected products for the live stream
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS product_ids UUID[] DEFAULT '{}';

-- Optional: Update RLS if needed, but usually not required for new columns in authenticated rooms
COMMENT ON COLUMN public.rooms.product_ids IS 'List of product IDs selected by the host for this specific live session';
