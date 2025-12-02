-- Add unique constraint on search_query for upsert operations
ALTER TABLE public.search_trends 
ADD CONSTRAINT search_trends_search_query_key UNIQUE (search_query);