
-- ============================================================
-- PHASE 1: Fix Critical Security Vulnerabilities
-- ============================================================

-- 1-5. Drop open policies on sensitive tables
DROP POLICY IF EXISTS "Allow edge function access" ON public.password_reset_tokens;
DROP POLICY IF EXISTS "System can manage approval tokens" ON public.email_approval_tokens;
DROP POLICY IF EXISTS "System can manage delivery logs" ON public.email_delivery_logs;
DROP POLICY IF EXISTS "Admin can manage pricing settings" ON public.pricing_settings;
DROP POLICY IF EXISTS "Pricing settings are publicly readable" ON public.pricing_settings;
DROP POLICY IF EXISTS "Public can view invitations by token" ON public.pending_gift_invitations;
DROP POLICY IF EXISTS "Public can view pending gift invitations" ON public.pending_gift_invitations;

-- 6. refund_requests
DROP POLICY IF EXISTS "System can manage refund requests" ON public.refund_requests;
CREATE POLICY "Service role can manage refund requests"
ON public.refund_requests FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 7. user_connections
DROP POLICY IF EXISTS "Anyone can view pending invitations" ON public.user_connections;

-- 8. return_events
DROP POLICY IF EXISTS "Admin users can view return events" ON public.return_events;
DROP POLICY IF EXISTS "Admin users can update return events" ON public.return_events;
DROP POLICY IF EXISTS "System can insert return events" ON public.return_events;
CREATE POLICY "Business admins can view return events"
ON public.return_events FOR SELECT TO authenticated USING (public.is_business_admin(auth.uid()));
CREATE POLICY "Business admins can update return events"
ON public.return_events FOR UPDATE TO authenticated USING (public.is_business_admin(auth.uid()));
CREATE POLICY "Service role can insert return events"
ON public.return_events FOR INSERT TO service_role WITH CHECK (true);

-- 9. wishlist_item_purchases
DROP POLICY IF EXISTS "Anyone can view purchase records" ON public.wishlist_item_purchases;
CREATE POLICY "Wishlist owners can view purchases of their items"
ON public.wishlist_item_purchases FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.wishlist_items wi
    JOIN public.wishlists w ON w.id = wi.wishlist_id
    WHERE wi.id = wishlist_item_purchases.item_id AND w.user_id = auth.uid()
  ) OR auth.uid() = purchaser_user_id
);

-- 10-11. product/profile analytics
DROP POLICY IF EXISTS "Service can view aggregated product analytics" ON public.product_analytics;
DROP POLICY IF EXISTS "System can manage completion analytics" ON public.profile_completion_analytics;
CREATE POLICY "Service role can manage completion analytics"
ON public.profile_completion_analytics FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 12. Fix is_group_admin/is_group_member parameter shadowing
-- First drop dependent policies
DROP POLICY IF EXISTS "Group admins can manage members" ON public.group_chat_members;
DROP POLICY IF EXISTS "Users can view group members of groups they belong to" ON public.group_chat_members;
DROP POLICY IF EXISTS "Group admins can update group chats" ON public.group_chats;
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.group_chats;

-- Drop and recreate functions with fixed param names
DROP FUNCTION IF EXISTS public.is_group_admin(uuid, uuid);
CREATE FUNCTION public.is_group_admin(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $$ BEGIN RETURN EXISTS (
  SELECT 1 FROM public.group_chat_members WHERE group_chat_id = _group_id AND user_id = _user_id AND role = 'admin'
); END; $$;

DROP FUNCTION IF EXISTS public.is_group_member(uuid, uuid);
CREATE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO ''
AS $$ BEGIN RETURN EXISTS (
  SELECT 1 FROM public.group_chat_members WHERE group_chat_id = _group_id AND user_id = _user_id
); END; $$;

-- Recreate the dependent policies (same logic, now using fixed functions)
CREATE POLICY "Group admins can manage members"
ON public.group_chat_members FOR ALL TO authenticated
USING (public.is_group_admin(group_chat_id, auth.uid()));
CREATE POLICY "Users can view group members of groups they belong to"
ON public.group_chat_members FOR SELECT TO authenticated
USING (public.is_group_member(group_chat_id, auth.uid()));
CREATE POLICY "Group admins can update group chats"
ON public.group_chats FOR UPDATE TO authenticated
USING (public.is_group_admin(id, auth.uid()));
CREATE POLICY "Users can view groups they are members of"
ON public.group_chats FOR SELECT TO authenticated
USING (public.is_group_member(id, auth.uid()));

-- 13. conversation_threads: remove anonymous access
DROP POLICY IF EXISTS "Users can view their own conversation threads" ON public.conversation_threads;
DROP POLICY IF EXISTS "Users can update their own conversation threads" ON public.conversation_threads;
DROP POLICY IF EXISTS "Users can create conversation threads" ON public.conversation_threads;

CREATE POLICY "Users can view their own conversation threads"
ON public.conversation_threads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own conversation threads"
ON public.conversation_threads FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create conversation threads"
ON public.conversation_threads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role can manage conversation threads"
ON public.conversation_threads FOR ALL TO service_role USING (true) WITH CHECK (true);
