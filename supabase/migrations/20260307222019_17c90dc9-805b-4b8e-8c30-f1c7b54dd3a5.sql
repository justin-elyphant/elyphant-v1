
-- Create updated_at trigger function for vendor tables
CREATE OR REPLACE FUNCTION public.update_vendor_orders_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create vendor_orders table
CREATE TABLE public.vendor_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_account_id UUID NOT NULL REFERENCES public.vendor_accounts(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  shipping_address_masked JSONB DEFAULT '{}'::jsonb,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  vendor_payout NUMERIC(10,2) NOT NULL DEFAULT 0,
  tracking_number TEXT,
  carrier TEXT,
  customer_name TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_orders ENABLE ROW LEVEL SECURITY;

-- SECURITY DEFINER function for vendor ownership check
CREATE OR REPLACE FUNCTION public.get_vendor_account_id_for_user(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.vendor_accounts WHERE user_id = _user_id LIMIT 1
$$;

-- RLS policies
CREATE POLICY "Vendors can view own orders"
  ON public.vendor_orders FOR SELECT TO authenticated
  USING (vendor_account_id = public.get_vendor_account_id_for_user(auth.uid()));

CREATE POLICY "Vendors can update own orders"
  ON public.vendor_orders FOR UPDATE TO authenticated
  USING (vendor_account_id = public.get_vendor_account_id_for_user(auth.uid()))
  WITH CHECK (vendor_account_id = public.get_vendor_account_id_for_user(auth.uid()));

-- Indexes
CREATE INDEX idx_vendor_orders_vendor_account_id ON public.vendor_orders(vendor_account_id);
CREATE INDEX idx_vendor_orders_status ON public.vendor_orders(status);
CREATE INDEX idx_vendor_orders_created_at ON public.vendor_orders(created_at DESC);

-- Updated_at trigger
CREATE TRIGGER update_vendor_orders_updated_at
  BEFORE UPDATE ON public.vendor_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vendor_orders_timestamp();
