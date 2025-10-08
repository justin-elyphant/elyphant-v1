-- Fix foreign key constraint to allow order deletion
-- Drop existing constraint and recreate with ON DELETE CASCADE
ALTER TABLE public.order_email_events
DROP CONSTRAINT IF EXISTS order_email_events_order_id_fkey;

ALTER TABLE public.order_email_events
ADD CONSTRAINT order_email_events_order_id_fkey
FOREIGN KEY (order_id)
REFERENCES public.orders(id)
ON DELETE CASCADE;