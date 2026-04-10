
-- =============================================================
-- MIGRATION 1: Fix 3 Critical Security Errors
-- =============================================================

-- -------------------------------------------------------
-- 1. PROFILES: Restrict connected-profiles policy to accepted only
-- -------------------------------------------------------

-- Drop the overly-permissive policy that includes 'pending' connections
DROP POLICY IF EXISTS "Users can view connected profiles" ON public.profiles;

-- Recreate: only accepted connections can see profile rows
CREATE POLICY "Users can view connected profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM public.user_connections
    WHERE (
      (user_connections.user_id = auth.uid() AND user_connections.connected_user_id = profiles.id)
      OR
      (user_connections.connected_user_id = auth.uid() AND user_connections.user_id = profiles.id)
    )
    AND user_connections.status = 'accepted'
  )
);

-- Drop the two duplicate public-wishlist-owner policies (one exposes full rows to anon)
DROP POLICY IF EXISTS "Anyone can view public wishlist owner profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public read for public wishlist owners" ON public.profiles;

-- Replace with a single policy that only exposes rows (UI must still mask PII)
CREATE POLICY "Public wishlist owners are discoverable"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.wishlists w
    WHERE w.user_id = profiles.id AND w.is_public = true
  )
);

-- -------------------------------------------------------
-- 2. GUEST ORDERS: Remove unauthenticated access
-- -------------------------------------------------------

DROP POLICY IF EXISTS "Guests can view recent orders by session" ON public.orders;

-- -------------------------------------------------------
-- 3. REALTIME: Remove orders from publication
-- -------------------------------------------------------

ALTER PUBLICATION supabase_realtime DROP TABLE public.orders;
