-- Fix security warnings by properly recreating functions with search_path
DROP TRIGGER IF EXISTS update_popularity_on_analytics ON public.product_analytics;
DROP TRIGGER IF EXISTS update_popularity_scores_updated_at ON public.popularity_scores;
DROP FUNCTION IF EXISTS public.update_popularity_scores();
DROP FUNCTION IF EXISTS public.update_analytics_updated_at();

-- Recreate functions with proper search_path
CREATE OR REPLACE FUNCTION public.update_popularity_scores()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Update popularity score when new analytics data is added
  INSERT INTO public.popularity_scores (product_id, customer_score, engagement_score)
  VALUES (NEW.product_id, 1, CASE WHEN NEW.event_type = 'view' THEN 1 ELSE 2 END)
  ON CONFLICT (product_id) DO UPDATE SET
    customer_score = public.popularity_scores.customer_score + 1,
    engagement_score = public.popularity_scores.engagement_score + CASE WHEN NEW.event_type = 'view' THEN 1 ELSE 2 END,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_analytics_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER update_popularity_on_analytics
  AFTER INSERT ON public.product_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_popularity_scores();

CREATE TRIGGER update_popularity_scores_updated_at
  BEFORE UPDATE ON public.popularity_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_analytics_updated_at();