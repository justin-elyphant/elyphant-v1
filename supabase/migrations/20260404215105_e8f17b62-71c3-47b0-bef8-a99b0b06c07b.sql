ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS popularity_score numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS search_impression_count integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_products_popularity_score ON public.products (popularity_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_products_search_impression_count ON public.products (search_impression_count DESC NULLS LAST);