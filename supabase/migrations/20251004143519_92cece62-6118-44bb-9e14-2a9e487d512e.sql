-- Create zinc_sync_logs table for tracking polling operations
CREATE TABLE IF NOT EXISTS public.zinc_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  sync_type TEXT NOT NULL, -- 'manual' or 'scheduled'
  triggered_by UUID REFERENCES auth.users(id),
  orders_checked INTEGER DEFAULT 0,
  orders_updated INTEGER DEFAULT 0,
  orders_failed INTEGER DEFAULT 0,
  execution_time_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE public.zinc_sync_logs ENABLE ROW LEVEL SECURITY;

-- Business admins can view sync logs
CREATE POLICY "Business admins can view zinc sync logs"
  ON public.zinc_sync_logs
  FOR SELECT
  TO authenticated
  USING (is_business_admin(auth.uid()));

-- Service role can insert sync logs
CREATE POLICY "Service role can insert sync logs"
  ON public.zinc_sync_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Service role can update sync logs
CREATE POLICY "Service role can update sync logs"
  ON public.zinc_sync_logs
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create index for performance
CREATE INDEX idx_zinc_sync_logs_created_at ON public.zinc_sync_logs(created_at DESC);
CREATE INDEX idx_zinc_sync_logs_status ON public.zinc_sync_logs(status);