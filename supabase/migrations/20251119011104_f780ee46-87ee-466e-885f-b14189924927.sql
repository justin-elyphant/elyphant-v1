-- Nicole AI Product Catalog Schema
-- Products table: stores product data from Zinc API
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  brand TEXT,
  category TEXT,
  price NUMERIC(10,2),
  image_url TEXT,
  retailer TEXT DEFAULT 'amazon',
  metadata JSONB DEFAULT '{}'::jsonb,
  search_terms TEXT[] DEFAULT ARRAY[]::TEXT[],
  freshness_score NUMERIC(3,2) DEFAULT 1.0,
  conversion_rate NUMERIC(5,4) DEFAULT 0.0,
  view_count INTEGER DEFAULT 0,
  purchase_count INTEGER DEFAULT 0,
  last_refreshed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Search trends table: tracks user searches for Nicole AI optimization
CREATE TABLE IF NOT EXISTS public.search_trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_query TEXT NOT NULL,
  search_count INTEGER DEFAULT 1,
  last_searched_at TIMESTAMPTZ DEFAULT NOW(),
  conversion_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product analytics table: detailed tracking for Nicole AI learning
CREATE TABLE IF NOT EXISTS public.product_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_search_terms ON public.products USING GIN(search_terms);
CREATE INDEX IF NOT EXISTS idx_products_freshness ON public.products(freshness_score DESC);
CREATE INDEX IF NOT EXISTS idx_products_conversion ON public.products(conversion_rate DESC);
CREATE INDEX IF NOT EXISTS idx_search_trends_query ON public.search_trends(search_query);
CREATE INDEX IF NOT EXISTS idx_search_trends_count ON public.search_trends(search_count DESC);
CREATE INDEX IF NOT EXISTS idx_product_analytics_product ON public.product_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_event ON public.product_analytics(event_type);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Products are public read, service role write
CREATE POLICY "Products are viewable by everyone"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "Service role can manage products"
  ON public.products FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies: Search trends are public read, authenticated write
CREATE POLICY "Search trends are viewable by everyone"
  ON public.search_trends FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can record searches"
  ON public.search_trends FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Service role can manage search trends"
  ON public.search_trends FOR ALL
  USING (auth.role() = 'service_role');

-- RLS Policies: Analytics are service role only
CREATE POLICY "Service role can manage analytics"
  ON public.product_analytics FOR ALL
  USING (auth.role() = 'service_role');

-- Function: Get high-converting products by category
CREATE OR REPLACE FUNCTION public.get_high_converting_products(
  p_category TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  product_id UUID,
  title TEXT,
  brand TEXT,
  price NUMERIC,
  image_url TEXT,
  conversion_rate NUMERIC
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    id as product_id,
    title,
    brand,
    price,
    image_url,
    conversion_rate
  FROM public.products
  WHERE (p_category IS NULL OR category = p_category)
    AND freshness_score > 0.5
  ORDER BY conversion_rate DESC, view_count DESC
  LIMIT p_limit;
$$;

-- Function: Decay product freshness weekly (Nicole AI maintenance)
CREATE OR REPLACE FUNCTION public.decay_product_freshness()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.products
  SET freshness_score = GREATEST(0.1, freshness_score * 0.95)
  WHERE last_refreshed_at < NOW() - INTERVAL '7 days';
END;
$$;