-- Update test order scheduled delivery date for testing cron processing
UPDATE public.orders 
SET scheduled_delivery_date = '2025-09-27'::date,
    updated_at = now()
WHERE id = '3565b880-5f0b-4849-9c5d-8bb8487e1f5b'::uuid;