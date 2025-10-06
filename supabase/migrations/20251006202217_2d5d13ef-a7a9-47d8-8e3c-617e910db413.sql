-- Add markup tracking to ZMA funding schedule
ALTER TABLE public.zma_funding_schedule
ADD COLUMN IF NOT EXISTS total_markup_retained NUMERIC(10,2) DEFAULT 0;