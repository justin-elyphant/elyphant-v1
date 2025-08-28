-- Reset the test execution to pending_approval status for retesting
UPDATE automated_gift_executions 
SET 
  status = 'pending_approval',
  order_id = NULL,
  error_message = NULL,
  updated_at = now()
WHERE id = 'c60f3ea8-c1fd-4842-9d56-5f7b2035bdf3';