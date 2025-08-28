-- Reset the test execution and order back to pending for ZMA testing
-- This allows us to test the new ZMA routing implementation

-- Reset the automated gift execution back to pending
UPDATE automated_gift_executions 
SET 
  status = 'pending',
  order_id = NULL,
  selected_products = NULL,
  total_amount = NULL,
  error_message = NULL,
  retry_count = 0,
  next_retry_at = NULL,
  updated_at = now()
WHERE id = 'c60f3ea8-c1fd-4842-9d56-5f7b2035bdf3';

-- Reset the order back to pending (if it exists)
UPDATE orders 
SET 
  status = 'pending',
  zinc_order_id = NULL,
  zinc_status = NULL,
  zma_order_id = NULL,
  zma_account_used = NULL,
  payment_status = 'pending',
  updated_at = now()
WHERE id = '60e1dc44-eda6-4531-8dc5-b8087a20f66f';