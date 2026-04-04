
-- Add recipient_id column to orders table for efficient incoming gift queries
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS recipient_id uuid REFERENCES public.profiles(id);

-- Index for fast lookups by recipient
CREATE INDEX IF NOT EXISTS idx_orders_recipient_id ON public.orders(recipient_id) WHERE recipient_id IS NOT NULL;

-- Allow recipients to view orders sent to them
CREATE POLICY "Recipients can view their incoming gift orders"
ON public.orders FOR SELECT TO authenticated
USING (recipient_id = auth.uid());
