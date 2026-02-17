-- Fix known inflated diapers record (1980 cents -> $19.80)
UPDATE wishlist_items SET price = price / 100
WHERE id = '5903277f-2875-4c38-b821-4c2a58b3098f' AND product_id = 'B0FDX5186F' AND price = 1980;