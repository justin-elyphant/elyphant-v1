-- Fix cached Amazon products with prices stored in cents instead of dollars
-- This corrects ~25 products (lighters, knives, napkins, socks, etc.)
-- Accepted tradeoff: MacBooks at $1049.99 become $10.49 per unified pricing standard
UPDATE products
SET price = price / 100
WHERE price > 200
  AND retailer = 'amazon';