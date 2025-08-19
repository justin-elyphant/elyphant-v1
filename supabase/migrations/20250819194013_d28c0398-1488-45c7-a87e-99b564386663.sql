-- Data recovery for Dua Lipa's wishlist items
-- Creating 7 representative items using correct column structure

INSERT INTO wishlist_items (
  wishlist_id, 
  name, 
  title,
  description,
  price, 
  brand, 
  image_url, 
  product_id, 
  created_at
) VALUES
-- Items for Dua's wishlist (0fc73c50-559b-4fde-9750-634e0770d1b4)
(
  '0fc73c50-559b-4fde-9750-634e0770d1b4',
  'Vintage Leather Jacket',
  'Vintage Leather Jacket',
  'Perfect for concerts - premium leather jacket',
  299.99,
  'AllSaints',
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop',
  'ALT-VLJ-001',
  NOW()
),
(
  '0fc73c50-559b-4fde-9750-634e0770d1b4',
  'Professional Studio Headphones',
  'Professional Studio Headphones',
  'High-end headphones for music production',
  349.99,
  'Sony',
  'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop',
  'SONY-PSH-001',
  NOW()
),
(
  '0fc73c50-559b-4fde-9750-634e0770d1b4',
  'Vintage Vinyl Records Collection',
  'Vintage Vinyl Records Collection',
  'Classic albums from the 70s-80s era',
  199.99,
  'Various Artists',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop',
  'VIN-COL-001',
  NOW()
),
(
  '0fc73c50-559b-4fde-9750-634e0770d1b4',
  'Designer Sunglasses',
  'Designer Sunglasses',
  'Iconic aviator style sunglasses',
  450.00,
  'Ray-Ban',
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop',
  'RB-AVT-001',
  NOW()
),
(
  '0fc73c50-559b-4fde-9750-634e0770d1b4',
  'Luxury Skincare Set',
  'Luxury Skincare Set',
  'Complete anti-aging routine with premium ingredients',
  180.00,
  'La Mer',
  'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop',
  'LM-LSS-001',
  NOW()
),
(
  '0fc73c50-559b-4fde-9750-634e0770d1b4',
  'Silk Scarf',
  'Silk Scarf',
  'Limited edition print silk scarf',
  125.00,
  'Hermès',
  'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&h=400&fit=crop',
  'HER-SS-001',
  NOW()
),
(
  '0fc73c50-559b-4fde-9750-634e0770d1b4',
  'Artisan Coffee Beans',
  'Artisan Coffee Beans',
  'Single origin Ethiopian coffee beans',
  85.00,
  'Blue Bottle Coffee',
  'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop',
  'BBC-ACB-001',
  NOW()
);