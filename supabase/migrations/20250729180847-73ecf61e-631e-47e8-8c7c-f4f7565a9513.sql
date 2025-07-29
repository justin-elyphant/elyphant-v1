-- Update order 1fd70b90-7d6f-43a2-94e6-8b18273fe5a3 to use ZMA method
UPDATE orders 
SET 
  order_method = 'zma',
  zinc_order_id = NULL,
  zinc_status = NULL,
  updated_at = now()
WHERE id = '1fd70b90-7d6f-43a2-94e6-8b18273fe5a3';