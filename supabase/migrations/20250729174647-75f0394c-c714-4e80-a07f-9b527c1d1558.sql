-- Add ZMA support to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_method text DEFAULT 'zinc_api' CHECK (order_method IN ('zinc_api', 'zma'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zma_order_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS zma_account_used text;

-- Create ZMA accounts table
CREATE TABLE IF NOT EXISTS public.zma_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_name TEXT NOT NULL,
  api_key TEXT NOT NULL,
  account_balance NUMERIC DEFAULT 0,
  account_status TEXT DEFAULT 'active' CHECK (account_status IN ('active', 'inactive', 'suspended')),
  last_balance_check TIMESTAMP WITH TIME ZONE,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on ZMA accounts
ALTER TABLE public.zma_accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for ZMA accounts (service role only)
CREATE POLICY "Service role can manage ZMA accounts" ON public.zma_accounts
FOR ALL USING (true) WITH CHECK (true);

-- Add trigger for updated_at
CREATE TRIGGER update_zma_accounts_updated_at
  BEFORE UPDATE ON public.zma_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments for clarity
COMMENT ON TABLE public.zma_accounts IS 'ZMA (Zinc Managed Accounts) account credentials and status';
COMMENT ON COLUMN public.orders.order_method IS 'Method used to process the order: zinc_api or zma';
COMMENT ON COLUMN public.orders.zma_order_id IS 'ZMA order ID for orders processed through ZMA';
COMMENT ON COLUMN public.orders.zma_account_used IS 'ZMA account identifier used for the order';