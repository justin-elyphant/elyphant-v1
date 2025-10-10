-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;

-- Create new policy that allows both authenticated users and service_role
CREATE POLICY "Users and webhooks can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR auth.role() = 'service_role'
);