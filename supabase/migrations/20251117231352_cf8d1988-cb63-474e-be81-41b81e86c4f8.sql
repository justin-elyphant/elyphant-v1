-- Fix RLS policy on orders table to allow service_role to update orders
-- This is required for zinc-webhook and process-order-v2 to function correctly

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can update their own orders" ON orders;

-- Create new policy allowing both users and service_role
CREATE POLICY "Users and service can update orders"
ON orders FOR UPDATE
TO public
USING (
  (auth.uid() = user_id) OR 
  (auth.role() = 'service_role')
);

-- Add comment explaining the policy
COMMENT ON POLICY "Users and service can update orders" ON orders IS 
'Allows users to update their own orders, and allows service_role (edge functions) to update any order for webhook processing and order fulfillment';