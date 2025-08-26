-- Add service role policies for automated gift processing to access wishlists and wishlist items

-- Allow service role to read all wishlists for auto-gifting
CREATE POLICY "Service role can access wishlists for auto-gifting"
ON public.wishlists
FOR SELECT
TO service_role
USING (true);

-- Allow service role to read all wishlist items for auto-gifting  
CREATE POLICY "Service role can access wishlist items for auto-gifting"
ON public.wishlist_items
FOR SELECT
TO service_role
USING (true);