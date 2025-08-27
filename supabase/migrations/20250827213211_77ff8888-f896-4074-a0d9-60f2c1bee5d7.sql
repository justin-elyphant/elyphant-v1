-- Update the execution record with full product data from wishlist_items
UPDATE automated_gift_executions 
SET 
  selected_products = jsonb_build_array(
    jsonb_build_object(
      'product_id', 'B01FZZUL30',
      'id', 'B01FZZUL30',
      'title', 'Sharp Pebble Premium Whetstone Knife Sharpening Stone 2 Side Grit 1000/6000 Waterstone- Whetstone Knife Sharpener- NonSlip Bamboo Base & Angle Guide',
      'name', 'Sharp Pebble Premium Whetstone Knife Sharpening Stone 2 Side Grit 1000/6000 Waterstone- Whetstone Knife Sharpener- NonSlip Bamboo Base & Angle Guide',
      'price', 35.99,
      'image', 'https://m.media-amazon.com/images/I/71uXKKMBNyL._AC_UL480_.jpg',
      'image_url', 'https://m.media-amazon.com/images/I/71uXKKMBNyL._AC_UL480_.jpg',
      'brand', 'Sharp',
      'productSource', 'zinc_api',
      'isZincApiProduct', true
    )
  ),
  total_amount = 35.99,
  updated_at = now()
WHERE selected_products::text LIKE '%B01FZZUL30%';