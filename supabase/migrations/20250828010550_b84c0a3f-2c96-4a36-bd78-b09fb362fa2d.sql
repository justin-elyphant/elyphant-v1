-- Fix auto-gift execution status constraint to include enhanced flow statuses
-- Drop the existing restrictive constraint
ALTER TABLE automated_gift_executions 
DROP CONSTRAINT IF EXISTS automated_gift_executions_status_check;

-- Add updated constraint that includes all statuses used by enhanced auto-gift flow
ALTER TABLE automated_gift_executions 
ADD CONSTRAINT automated_gift_executions_status_check 
CHECK (status = ANY (ARRAY[
  'pending'::text,
  'processing'::text, 
  'pending_approval'::text,  -- Required for manual approval flow
  'approved'::text,          -- Required after approval but before order
  'rejected'::text,          -- Required for rejection handling
  'order_placed'::text,      -- Optional intermediate status
  'completed'::text,         -- Final success status
  'failed'::text,            -- Error status
  'cancelled'::text          -- Cancellation status
]));

-- Reset the stuck test execution to clean state for complete flow testing
UPDATE automated_gift_executions 
SET 
  status = 'pending',
  selected_products = NULL,
  total_amount = NULL,
  retry_count = 0,
  order_id = NULL,
  error_message = NULL,
  updated_at = now()
WHERE id = 'c60f3ea8-c1fd-4842-9d56-5f7b2035bdf3';