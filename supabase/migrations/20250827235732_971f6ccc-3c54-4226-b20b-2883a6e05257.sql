-- Reset the execution and test complete payment flow
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