-- Update order with Zinc response data
UPDATE orders 
SET 
  status = 'shipped',
  zinc_order_id = '12ebaecd2c132685a53472949613a0e7',
  zinc_status = 'shipped',
  tracking_number = 'ZPYAA000950820YQ',
  updated_at = now()
WHERE id = '1fd70b90-7d6f-43a2-94e6-8b18273fe5a3';

-- Add order note for successful Zinc processing
INSERT INTO order_notes (
  order_id,
  admin_user_id,
  note_content,
  note_type,
  is_internal
) VALUES (
  '1fd70b90-7d6f-43a2-94e6-8b18273fe5a3',
  (SELECT user_id FROM orders WHERE id = '1fd70b90-7d6f-43a2-94e6-8b18273fe5a3'),
  'Order successfully processed through Zinc API. Zinc Order ID: 12ebaecd2c132685a53472949613a0e7. Tracking: ZPYAA000950820YQ (ZNLOGIC), TBA32334947B095 (RETAILER). Estimated delivery: 8/5/2025.',
  'status_update',
  false
);