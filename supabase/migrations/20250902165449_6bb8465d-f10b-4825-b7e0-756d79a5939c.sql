-- Update the automated_gift_executions record to have proper product object instead of string array
UPDATE automated_gift_executions 
SET selected_products = '[{
  "id": "b39a14d2-e142-4eea-87af-a8258ab43516",
  "product_id": "b39a14d2-e142-4eea-87af-a8258ab43516",
  "title": "Sharp Pebble Premium Whetstone Knife Sharpening Stone",
  "name": "Sharp Pebble Premium Whetstone Knife Sharpening Stone", 
  "price": 35.99,
  "image": "https://images-na.ssl-images-amazon.com/images/I/71j4Y7X8NFL._AC_UL320_.jpg",
  "image_url": "https://images-na.ssl-images-amazon.com/images/I/71j4Y7X8NFL._AC_UL320_.jpg",
  "brand": "Sharp Pebble",
  "description": "Premium dual grit whetstone for knife sharpening with angle guide",
  "category": "Kitchen & Dining",
  "productSource": "zinc_api"
}]'::jsonb,
total_amount = 35.99,
updated_at = now()
WHERE id = 'c60f3ea8-c1fd-4842-9d56-5f7b2035bdf3';