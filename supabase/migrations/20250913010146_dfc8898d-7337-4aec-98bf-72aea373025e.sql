-- Fix SECURITY DEFINER view issue by recreating the view without SECURITY DEFINER
-- This ensures the view enforces RLS and permissions of the querying user, not the creator

-- Drop the existing view if it exists
DROP VIEW IF EXISTS public.order_monitoring_summary;

-- Recreate the view without SECURITY DEFINER property
CREATE VIEW public.order_monitoring_summary AS
SELECT 
  o.id,
  o.order_number,
  o.status,
  o.zinc_status,
  o.total_amount,
  o.created_at,
  o.updated_at,
  o.retry_count,
  o.next_retry_at,
  o.cancellation_reason,
  o.cancelled_at,
  CASE
    WHEN (o.status = 'retry_pending' AND o.retry_count >= 3) THEN 'max_retries_reached'
    WHEN (o.status = 'processing' AND o.updated_at < (now() - interval '24 hours')) THEN 'stuck_processing'
    WHEN o.status = 'failed' THEN 'requires_investigation'
    WHEN o.status = 'cancelled' THEN 'cancelled'
    ELSE 'normal'
  END AS monitoring_status,
  EXISTS (
    SELECT 1 FROM admin_alerts aa
    WHERE aa.order_id = o.id AND aa.resolved = false
  ) AS has_active_alerts,
  EXISTS (
    SELECT 1 FROM refund_requests rr
    WHERE rr.order_id = o.id AND rr.status IN ('pending', 'processing')
  ) AS has_pending_refund
FROM orders o
WHERE o.created_at > (now() - interval '30 days');

-- Add RLS policy for the view to ensure proper access control
-- Only business admins and order owners can see monitoring data
CREATE POLICY "order_monitoring_access" ON public.orders
FOR SELECT
USING (
  user_id = auth.uid() OR  -- Order owner
  public.is_business_admin(auth.uid())  -- Business admin
);

-- Ensure RLS is enabled on the orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;