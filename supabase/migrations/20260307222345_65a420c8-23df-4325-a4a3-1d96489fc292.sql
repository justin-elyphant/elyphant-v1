
-- Add vendor_account_id to products table for vendor ownership
ALTER TABLE public.products ADD COLUMN vendor_account_id UUID REFERENCES public.vendor_accounts(id) ON DELETE SET NULL;
CREATE INDEX idx_products_vendor_account_id ON public.products(vendor_account_id);

-- Add shipping and settings columns to vendor_accounts
ALTER TABLE public.vendor_accounts 
  ADD COLUMN shipping_type TEXT DEFAULT 'flat_rate',
  ADD COLUMN shipping_flat_rate NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN free_shipping_enabled BOOLEAN DEFAULT false,
  ADD COLUMN free_shipping_threshold NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN phone TEXT,
  ADD COLUMN website TEXT,
  ADD COLUMN description TEXT,
  ADD COLUMN logo_url TEXT,
  ADD COLUMN notification_preferences JSONB DEFAULT '{"email_orders": true, "email_returns": true}'::jsonb;
