-- Add zma_error field to track Zinc API errors
ALTER TABLE public.orders 
ADD COLUMN zma_error TEXT;