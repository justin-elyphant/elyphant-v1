-- Fix the specific execution with proper product data
UPDATE automated_gift_executions 
SET selected_products = '[{
  "product_id": "b39a14d2-e142-4eea-87af-a8258ab43516",
  "id": "b39a14d2-e142-4eea-87af-a8258ab43516",
  "title": "Sharp Pebble Premium Whetstone Knife Sharpening Stone 2 Side Grit 1000/6000 Waterstone- Whetstone Knife Sharpener- NonSlip Bamboo Base & Angle Guide",
  "name": "Sharp Pebble Premium Whetstone Knife Sharpening Stone 2 Side Grit 1000/6000 Waterstone- Whetstone Knife Sharpener- NonSlip Bamboo Base & Angle Guide",
  "price": 35.99,
  "image": "https://m.media-amazon.com/images/I/71uXKKMBNyL._AC_UL480_.jpg",
  "image_url": "https://m.media-amazon.com/images/I/71uXKKMBNyL._AC_UL480_.jpg",
  "brand": "Sharp",
  "description": null,
  "product_details": null,
  "features": null,
  "productSource": "wishlist"
}]'::jsonb,
total_amount = 35.99,
updated_at = now()
WHERE id = 'c60f3ea8-c1fd-4842-9d56-5f7b2035bdf3';