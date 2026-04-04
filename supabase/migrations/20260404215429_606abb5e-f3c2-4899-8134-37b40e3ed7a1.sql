CREATE OR REPLACE FUNCTION public.increment_search_impressions(product_ids text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products
  SET search_impression_count = COALESCE(search_impression_count, 0) + 1
  WHERE product_id = ANY(product_ids);
END;
$$;