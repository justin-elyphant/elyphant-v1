-- Fix remaining RLS policies with auth.uid() performance issues

-- User search history policies
DROP POLICY IF EXISTS "Users can view their own search history" ON public.user_search_history;
CREATE POLICY "Users can view their own search history" 
ON public.user_search_history 
FOR SELECT 
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own search history" ON public.user_search_history;
CREATE POLICY "Users can delete their own search history" 
ON public.user_search_history 
FOR DELETE 
USING ((select auth.uid()) = user_id);

-- Orders policies
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
CREATE POLICY "Users can update their own orders" 
ON public.orders 
FOR UPDATE 
USING ((select auth.uid()) = user_id);

-- Order items policies
DROP POLICY IF EXISTS "Users can view their own order items" ON public.order_items;
CREATE POLICY "Users can view their own order items" 
ON public.order_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.orders o 
  WHERE o.id = order_items.order_id 
  AND o.user_id = (select auth.uid())
));

-- Check for any other remaining auth.uid() policies and fix them
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname, qual 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND qual LIKE '%auth.uid()%'
        AND qual NOT LIKE '%(select auth.uid())%'
    LOOP
        RAISE NOTICE 'Found policy with unoptimized auth.uid(): %.%.%', 
            policy_record.schemaname, policy_record.tablename, policy_record.policyname;
    END LOOP;
END $$;