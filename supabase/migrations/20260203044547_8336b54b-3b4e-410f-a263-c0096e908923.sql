-- Fix historical cached product prices that were stored in cents instead of dollars
-- Products with price > 200 are almost certainly in cents (e.g., 3374 = $33.74)
UPDATE products 
SET price = price / 100 
WHERE price > 200 
  AND retailer = 'amazon';