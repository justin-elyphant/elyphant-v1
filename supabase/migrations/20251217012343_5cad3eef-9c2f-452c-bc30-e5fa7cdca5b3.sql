-- Enable pg_trgm extension for fuzzy text matching (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create index for fuzzy title search on products table
CREATE INDEX IF NOT EXISTS idx_products_title_trgm ON products USING gin (title gin_trgm_ops);

-- Create index for fuzzy brand search
CREATE INDEX IF NOT EXISTS idx_products_brand_trgm ON products USING gin (brand gin_trgm_ops);

-- Add zero_results tracking column to search_trends if not exists
ALTER TABLE search_trends ADD COLUMN IF NOT EXISTS zero_results BOOLEAN DEFAULT FALSE;

-- Create fuzzy product search function for typo tolerance
CREATE OR REPLACE FUNCTION fuzzy_product_search(
  search_query TEXT,
  similarity_threshold FLOAT DEFAULT 0.3,
  result_limit INT DEFAULT 20
)
RETURNS TABLE (
  product_id TEXT,
  title TEXT,
  price NUMERIC,
  image_url TEXT,
  brand TEXT,
  category TEXT,
  metadata JSONB,
  view_count INT,
  similarity_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.product_id,
    p.title,
    p.price,
    p.image_url,
    p.brand,
    p.category,
    p.metadata,
    p.view_count,
    similarity(p.title, search_query) AS similarity_score
  FROM products p
  WHERE similarity(p.title, search_query) > similarity_threshold
  ORDER BY 
    similarity(p.title, search_query) DESC,
    p.view_count DESC NULLS LAST
  LIMIT result_limit;
END;
$$;