-- Create zma_funding_schedule table to track funding events
CREATE TABLE IF NOT EXISTS public.zma_funding_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expected_payout_date DATE,
  expected_payout_amount NUMERIC(10,2),
  stripe_payout_id TEXT,
  transferred_to_zinc BOOLEAN DEFAULT false,
  transfer_date TIMESTAMP WITH TIME ZONE,
  transfer_amount NUMERIC(10,2),
  admin_confirmed_by UUID REFERENCES auth.users(id),
  zma_balance_before NUMERIC(10,2),
  zma_balance_after NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create zma_funding_alerts table to track alerts sent to admins
CREATE TABLE IF NOT EXISTS public.zma_funding_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_balance', 'critical_balance', 'pending_orders_waiting')),
  zma_current_balance NUMERIC(10,2) NOT NULL,
  pending_orders_value NUMERIC(10,2) NOT NULL,
  recommended_transfer_amount NUMERIC(10,2) NOT NULL,
  orders_count_waiting INTEGER DEFAULT 0,
  alert_sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  email_sent BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add funding-related columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS funding_status TEXT CHECK (funding_status IN ('funded', 'awaiting_funds', 'funds_allocated')),
ADD COLUMN IF NOT EXISTS funding_hold_reason TEXT,
ADD COLUMN IF NOT EXISTS funding_allocated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS expected_funding_date DATE;

-- Enable RLS on new tables
ALTER TABLE public.zma_funding_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zma_funding_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for zma_funding_schedule (business admins only)
CREATE POLICY "Business admins can view funding schedule"
  ON public.zma_funding_schedule FOR SELECT
  TO authenticated
  USING (is_business_admin(auth.uid()));

CREATE POLICY "Business admins can manage funding schedule"
  ON public.zma_funding_schedule FOR ALL
  TO authenticated
  USING (is_business_admin(auth.uid()))
  WITH CHECK (is_business_admin(auth.uid()));

-- RLS policies for zma_funding_alerts (business admins only)
CREATE POLICY "Business admins can view funding alerts"
  ON public.zma_funding_alerts FOR SELECT
  TO authenticated
  USING (is_business_admin(auth.uid()));

CREATE POLICY "System can insert funding alerts"
  ON public.zma_funding_alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Business admins can update funding alerts"
  ON public.zma_funding_alerts FOR UPDATE
  TO authenticated
  USING (is_business_admin(auth.uid()))
  WITH CHECK (is_business_admin(auth.uid()));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_funding_status ON public.orders(funding_status) WHERE funding_status = 'awaiting_funds';
CREATE INDEX IF NOT EXISTS idx_funding_alerts_resolved ON public.zma_funding_alerts(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_funding_schedule_transferred ON public.zma_funding_schedule(transferred_to_zinc) WHERE transferred_to_zinc = false;

-- Add trigger for updated_at on zma_funding_schedule
CREATE OR REPLACE FUNCTION update_zma_funding_schedule_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_zma_funding_schedule_timestamp
  BEFORE UPDATE ON public.zma_funding_schedule
  FOR EACH ROW
  EXECUTE FUNCTION update_zma_funding_schedule_updated_at();