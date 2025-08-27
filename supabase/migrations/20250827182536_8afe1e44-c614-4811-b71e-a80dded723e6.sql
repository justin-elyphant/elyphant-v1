-- Add RLS policy to allow connected users to view each other's wishlists
CREATE POLICY "Connected users can view each other's wishlists" 
ON public.wishlists 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    -- User can see their own wishlists (already covered by existing policy but kept for clarity)
    user_id = auth.uid() OR
    -- User can see public wishlists (already covered by existing policy but kept for clarity)  
    is_public = true OR
    -- Connected users can see each other's private wishlists
    EXISTS (
      SELECT 1 FROM public.user_connections uc
      WHERE ((uc.user_id = auth.uid() AND uc.connected_user_id = wishlists.user_id) OR
             (uc.user_id = wishlists.user_id AND uc.connected_user_id = auth.uid())) AND
            uc.status = 'accepted'
    )
  )
);