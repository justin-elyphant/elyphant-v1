-- Create order processing signals table for monitoring
CREATE TABLE IF NOT EXISTS public.order_processing_signals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL,
  trigger_source text NOT NULL,
  signal_metadata jsonb DEFAULT '{}',
  processed_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_processing_signals ENABLE ROW LEVEL SECURITY;

-- Create policy for system access
CREATE POLICY "System can manage processing signals" 
ON public.order_processing_signals 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_order_processing_signals_order_id 
ON public.order_processing_signals(order_id);

CREATE INDEX IF NOT EXISTS idx_order_processing_signals_created_at 
ON public.order_processing_signals(created_at DESC);