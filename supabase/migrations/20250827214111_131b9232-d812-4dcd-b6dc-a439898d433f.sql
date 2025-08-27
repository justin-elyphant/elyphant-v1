-- Create a test order record for ZMA processing (corrected)
WITH test_order AS (
  INSERT INTO orders (
    user_id,
    order_number,
    status,
    subtotal,
    total_amount,
    shipping_info,
    payment_status,
    order_method,
    is_gift,
    gift_message
  ) VALUES (
    (SELECT user_id FROM automated_gift_executions WHERE id = 'c60f3ea8-c1fd-4842-9d56-5f7b2035bdf3'),
    'TEST-ZMA-' || TO_CHAR(NOW(), 'YYYYMMDD-HH24MISS'),
    'pending',
    35.99,
    35.99,
    jsonb_build_object(
      'name', 'Test Recipient',
      'address', '123 Main St',
      'city', 'Beverly Hills',
      'state', 'CA',
      'zip', '90210',
      'country', 'US'
    ),
    'succeeded',
    'zma',
    true,
    'Test auto-gift from ZMA integration'
  )
  RETURNING id, order_number
)
INSERT INTO order_items (
  order_id,
  product_id,
  product_name,
  product_image,
  vendor,
  quantity,
  unit_price,
  total_price
) 
SELECT 
  t.id,
  'B01FZZUL30',
  'Sharp Pebble Premium Whetstone Knife Sharpening Stone 2 Side Grit 1000/6000 Waterstone- Whetstone Knife Sharpener- NonSlip Bamboo Base & Angle Guide',
  'https://m.media-amazon.com/images/I/71uXKKMBNyL._AC_UL480_.jpg',
  'Sharp',
  1,
  35.99,
  35.99
FROM test_order t
RETURNING order_id, product_id, product_name;