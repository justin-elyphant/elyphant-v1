-- Update specific order for real-world testing
UPDATE public.orders 
SET scheduled_delivery_date = '2025-10-01'
WHERE id = '3565b880-5f0b-4849-9c5d-8bb8487e1f5b';