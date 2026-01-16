-- Allow anyone to view public wishlists (no auth required)
CREATE POLICY "Anyone can view public wishlists"
  ON public.wishlists FOR SELECT
  USING (is_public = true);

-- Allow anyone to view items in public wishlists
CREATE POLICY "Anyone can view items in public wishlists"
  ON public.wishlist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wishlists w
      WHERE w.id = wishlist_items.wishlist_id
      AND w.is_public = true
    )
  );

-- Allow anyone to view minimal profile info for public wishlist owners
CREATE POLICY "Anyone can view public wishlist owner profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.wishlists w
      WHERE w.user_id = profiles.id
      AND w.is_public = true
    )
  );