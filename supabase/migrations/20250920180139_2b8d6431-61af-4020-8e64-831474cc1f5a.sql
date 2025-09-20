-- Add variation columns to order_items table to store product variation details
ALTER TABLE public.order_items 
ADD COLUMN variation_text text,
ADD COLUMN selected_variations jsonb;