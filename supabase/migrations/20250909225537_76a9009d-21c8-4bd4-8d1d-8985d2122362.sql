-- RLS Performance Optimization: Replace auth.uid() with (select auth.uid()) in all policies
-- This prevents re-evaluation of auth.uid() for each row, dramatically improving performance

-- Drop and recreate all affected RLS policies with optimized syntax

-- Messages table policies
DROP POLICY IF EXISTS "Users can update read status of received messages" ON public.messages;
CREATE POLICY "Users can update read status of received messages" 
ON public.messages 
FOR UPDATE 
USING ((select auth.uid()) = recipient_id)
WITH CHECK ((select auth.uid()) = recipient_id);

-- Funding campaigns policies
DROP POLICY IF EXISTS "Creators can view their own campaigns" ON public.funding_campaigns;
CREATE POLICY "Creators can view their own campaigns" 
ON public.funding_campaigns 
FOR SELECT 
USING ((select auth.uid()) = creator_id);

DROP POLICY IF EXISTS "Users can create campaigns" ON public.funding_campaigns;
CREATE POLICY "Users can create campaigns" 
ON public.funding_campaigns 
FOR INSERT 
WITH CHECK ((select auth.uid()) = creator_id);

DROP POLICY IF EXISTS "Creators can update their campaigns" ON public.funding_campaigns;
CREATE POLICY "Creators can update their campaigns" 
ON public.funding_campaigns 
FOR UPDATE 
USING ((select auth.uid()) = creator_id);

-- Contributions policies
DROP POLICY IF EXISTS "Contributors can view their own contributions" ON public.contributions;
CREATE POLICY "Contributors can view their own contributions" 
ON public.contributions 
FOR SELECT 
USING ((select auth.uid()) = contributor_id);

DROP POLICY IF EXISTS "Authenticated users can contribute" ON public.contributions;
CREATE POLICY "Authenticated users can contribute" 
ON public.contributions 
FOR INSERT 
WITH CHECK ((select auth.uid()) = contributor_id);

-- User connections policies
DROP POLICY IF EXISTS "Users can view their own connections" ON public.user_connections;
CREATE POLICY "Users can view their own connections" 
ON public.user_connections 
FOR SELECT 
USING (((select auth.uid()) = user_id) OR ((select auth.uid()) = connected_user_id));

DROP POLICY IF EXISTS "Users can create their own connections" ON public.user_connections;
CREATE POLICY "Users can create their own connections" 
ON public.user_connections 
FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own connections" ON public.user_connections;
CREATE POLICY "Users can update their own connections" 
ON public.user_connections 
FOR UPDATE 
USING (((select auth.uid()) = user_id) OR ((select auth.uid()) = connected_user_id));

DROP POLICY IF EXISTS "Users can delete their own connections" ON public.user_connections;
CREATE POLICY "Users can delete their own connections" 
ON public.user_connections 
FOR DELETE 
USING (((select auth.uid()) = user_id) OR ((select auth.uid()) = connected_user_id));

-- User addresses policies
DROP POLICY IF EXISTS "Users can manage their own addresses" ON public.user_addresses;
CREATE POLICY "Users can manage their own addresses" 
ON public.user_addresses 
FOR ALL 
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- User special dates policies
DROP POLICY IF EXISTS "Users can manage their own special dates" ON public.user_special_dates;
CREATE POLICY "Users can manage their own special dates" 
ON public.user_special_dates 
FOR ALL 
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view friends' special dates" ON public.user_special_dates;
CREATE POLICY "Users can view friends' special dates" 
ON public.user_special_dates 
FOR SELECT 
USING (
  ((select auth.uid()) = user_id) OR 
  (
    visibility IN ('friends', 'public') AND 
    EXISTS (
      SELECT 1 FROM public.user_connections uc 
      WHERE ((uc.user_id = (select auth.uid()) AND uc.connected_user_id = user_special_dates.user_id) OR
             (uc.user_id = user_special_dates.user_id AND uc.connected_user_id = (select auth.uid()))) 
      AND uc.status = 'accepted'
    )
  ) OR 
  (visibility = 'public')
);

DROP POLICY IF EXISTS "Users can view their own special dates" ON public.user_special_dates;
DROP POLICY IF EXISTS "Users can create their own special dates" ON public.user_special_dates;
DROP POLICY IF EXISTS "Users can update their own special dates" ON public.user_special_dates;
DROP POLICY IF EXISTS "Users can delete their own special dates" ON public.user_special_dates;

-- Auto gifting rules policies
DROP POLICY IF EXISTS "Users can manage their own auto-gifting rules" ON public.auto_gifting_rules;
CREATE POLICY "Users can manage their own auto-gifting rules" 
ON public.auto_gifting_rules 
FOR ALL 
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can view their own auto gifting rules" ON public.auto_gifting_rules;
DROP POLICY IF EXISTS "Users can create their own auto gifting rules" ON public.auto_gifting_rules;
DROP POLICY IF EXISTS "Users can update their own auto gifting rules" ON public.auto_gifting_rules;
DROP POLICY IF EXISTS "Users can delete their own auto gifting rules" ON public.auto_gifting_rules;

-- Gift searches policies
DROP POLICY IF EXISTS "Users can select their own gift searches" ON public.gift_searches;
DROP POLICY IF EXISTS "Users can insert their own gift searches" ON public.gift_searches;
DROP POLICY IF EXISTS "Users can update their own gift searches" ON public.gift_searches;
DROP POLICY IF EXISTS "Users can delete their own gift searches" ON public.gift_searches;

CREATE POLICY "Users can manage their own gift searches" 
ON public.gift_searches 
FOR ALL 
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- Wishlists policies
DROP POLICY IF EXISTS "user can manage own wishlists" ON public.wishlists;
CREATE POLICY "Users can manage their own wishlists" 
ON public.wishlists 
FOR ALL 
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- Wishlist items policies
DROP POLICY IF EXISTS "user can manage wishlist items" ON public.wishlist_items;
CREATE POLICY "Users can manage their own wishlist items" 
ON public.wishlist_items 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.wishlists w 
  WHERE w.id = wishlist_items.wishlist_id 
  AND w.user_id = (select auth.uid())
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.wishlists w 
  WHERE w.id = wishlist_items.wishlist_id 
  AND w.user_id = (select auth.uid())
));

-- Privacy settings policies
DROP POLICY IF EXISTS "Users can view their own privacy settings" ON public.privacy_settings;
CREATE POLICY "Users can view their own privacy settings" 
ON public.privacy_settings 
FOR SELECT 
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own privacy settings" ON public.privacy_settings;
CREATE POLICY "Users can update their own privacy settings" 
ON public.privacy_settings 
FOR UPDATE 
USING ((select auth.uid()) = user_id);

-- Blocked users policies
DROP POLICY IF EXISTS "Users can view their own blocked users" ON public.blocked_users;
DROP POLICY IF EXISTS "Users can manage their own blocked users" ON public.blocked_users;

CREATE POLICY "Users can manage their own blocked users" 
ON public.blocked_users 
FOR ALL 
USING ((select auth.uid()) = blocker_id)
WITH CHECK ((select auth.uid()) = blocker_id);

-- Group gift contributions policies
DROP POLICY IF EXISTS "Users can view contributions for their group projects" ON public.group_gift_contributions;
CREATE POLICY "Users can view contributions for their group projects" 
ON public.group_gift_contributions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.group_gift_projects gp 
  WHERE gp.id = group_gift_contributions.project_id 
  AND ((select auth.uid()) = gp.creator_id OR 
       EXISTS (SELECT 1 FROM public.group_gift_project_members gpm 
               WHERE gpm.project_id = gp.id AND gpm.user_id = (select auth.uid())))
));

-- Auto gifting settings policies
DROP POLICY IF EXISTS "Users can view their own auto gifting settings" ON public.auto_gifting_settings;
DROP POLICY IF EXISTS "Users can create their own auto gifting settings" ON public.auto_gifting_settings;
DROP POLICY IF EXISTS "Users can update their own auto gifting settings" ON public.auto_gifting_settings;
DROP POLICY IF EXISTS "Users can delete their own auto gifting settings" ON public.auto_gifting_settings;

CREATE POLICY "Users can manage their own auto gifting settings" 
ON public.auto_gifting_settings 
FOR ALL 
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- Recipient profiles policies
DROP POLICY IF EXISTS "Users can view their own recipient profiles" ON public.recipient_profiles;
DROP POLICY IF EXISTS "Users can create their own recipient profiles" ON public.recipient_profiles;
DROP POLICY IF EXISTS "Users can update their own recipient profiles" ON public.recipient_profiles;
DROP POLICY IF EXISTS "Users can delete their own recipient profiles" ON public.recipient_profiles;

CREATE POLICY "Users can manage their own recipient profiles" 
ON public.recipient_profiles 
FOR ALL 
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- AI gift searches policies
DROP POLICY IF EXISTS "Users can view their own AI gift searches" ON public.ai_gift_searches;
DROP POLICY IF EXISTS "Users can create their own AI gift searches" ON public.ai_gift_searches;
DROP POLICY IF EXISTS "Users can update their own AI gift searches" ON public.ai_gift_searches;

CREATE POLICY "Users can manage their own AI gift searches" 
ON public.ai_gift_searches 
FOR ALL 
USING ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- Add missing policies for tables that need them
CREATE POLICY "Users can insert their own privacy settings" 
ON public.privacy_settings 
FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

-- Comment documenting the optimization
COMMENT ON SCHEMA public IS 'RLS policies optimized on ' || CURRENT_DATE || ' to use (select auth.uid()) instead of auth.uid() for better performance';