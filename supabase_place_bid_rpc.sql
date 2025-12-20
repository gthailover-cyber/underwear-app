-- RPC to safely place a bid for a room
-- This bypasses RLS using SECURITY DEFINER so viewers can update the bid
CREATE OR REPLACE FUNCTION public.place_room_bid(room_id UUID, bid_amount INTEGER, bidder_name TEXT)
RETURNS VOID AS $$
BEGIN
    -- Only update if the new bid is higher than the current one
    UPDATE public.rooms
    SET current_bid = bid_amount,
        top_bidder_name = bidder_name
    WHERE id = room_id AND (current_bid IS NULL OR bid_amount > current_bid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
