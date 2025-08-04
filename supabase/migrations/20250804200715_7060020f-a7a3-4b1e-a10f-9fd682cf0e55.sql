-- Add gifting fee columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS gifting_fee NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS gifting_fee_name TEXT DEFAULT 'Elyphant Gifting Fee',
ADD COLUMN IF NOT EXISTS gifting_fee_description TEXT DEFAULT 'Platform service fee for streamlined delivery and customer support',
ADD COLUMN IF NOT EXISTS subtotal NUMERIC,
ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC DEFAULT 0;