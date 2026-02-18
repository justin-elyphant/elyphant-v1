-- Backfill wishlist_item_purchases for two orders that were missing tracking data
INSERT INTO wishlist_item_purchases
  (wishlist_id, item_id, product_id, purchaser_user_id, order_id, quantity, price_paid, is_anonymous)
VALUES
  ('de28ab25-c53d-4cda-90a2-5131b0f9f486', '5e3d6dd0-d94f-4f09-9f07-6836a5d17210', 'B00004OCKR', 'f5c6fbb5-f2f2-4430-b679-39ec117e3596', 'e7eac78f-5083-48a3-9c9d-e7c49a408f31', 1, 32.95, false),
  ('de28ab25-c53d-4cda-90a2-5131b0f9f486', '5903277f-2875-4c38-b821-4c2a58b3098f', 'B0FDX5186F', NULL, 'cf5f5f96-73a5-4513-98fd-aa7bf0bf1543', 1, 19.80, true);