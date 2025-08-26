-- Add productSource column to wishlist_items table for proper pricing handling
ALTER TABLE public.wishlist_items 
ADD COLUMN product_source text;

-- Add comment for documentation
COMMENT ON COLUMN public.wishlist_items.product_source IS 'Source of the product (zinc_api, shopify, vendor_portal, manual) for proper pricing formatting';

-- Update existing wishlist items to detect and set product_source based on data patterns
-- This detects Amazon/Zinc products by price patterns (likely cents-based integers)
-- and image URL patterns (Amazon CDN domains)
UPDATE public.wishlist_items 
SET product_source = CASE 
  -- Detect Amazon/Zinc products by price patterns and image URLs
  WHEN (price > 100 AND price = FLOOR(price)) 
    OR image_url LIKE '%amazon%' 
    OR image_url LIKE '%ssl-images-amazon%'
    OR image_url LIKE '%m.media-amazon%'
    THEN 'zinc_api'
  -- Default to manual for other products
  ELSE 'manual'
END
WHERE product_source IS NULL;