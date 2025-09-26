-- Create execution tracking table for cron job monitoring
CREATE TABLE IF NOT EXISTS public.scheduled_order_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL,
  order_id UUID,
  scheduled_delivery_date DATE,
  days_overdue INTEGER DEFAULT 0,
  alert_message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_order_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin alerts manageable by business admins" 
ON public.scheduled_order_alerts 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM business_admins ba 
  WHERE ba.user_id = auth.uid() 
  AND ba.admin_level IN ('owner', 'admin')
));

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_order_alerts_type_resolved 
ON public.scheduled_order_alerts (alert_type, is_resolved);

CREATE INDEX IF NOT EXISTS idx_scheduled_order_alerts_order_id 
ON public.scheduled_order_alerts (order_id);

-- Create function to check for missed scheduled orders
CREATE OR REPLACE FUNCTION public.check_missed_scheduled_orders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  missed_order RECORD;
  days_overdue integer;
BEGIN
  -- Find orders that should have been processed but weren't
  FOR missed_order IN
    SELECT 
      id,
      order_number, 
      scheduled_delivery_date,
      created_at
    FROM public.orders
    WHERE status = 'scheduled'
      AND scheduled_delivery_date < CURRENT_DATE - INTERVAL '4 days'
      AND NOT EXISTS (
        SELECT 1 FROM public.scheduled_order_alerts
        WHERE order_id = orders.id 
        AND alert_type = 'missed_processing'
        AND is_resolved = false
      )
  LOOP
    -- Calculate days overdue
    days_overdue := CURRENT_DATE - missed_order.scheduled_delivery_date - 4;
    
    -- Create alert
    INSERT INTO public.scheduled_order_alerts (
      alert_type,
      order_id,
      scheduled_delivery_date,
      days_overdue,
      alert_message,
      metadata
    ) VALUES (
      'missed_processing',
      missed_order.id,
      missed_order.scheduled_delivery_date,
      days_overdue,
      'Order ' || missed_order.order_number || ' missed its processing window by ' || days_overdue || ' days',
      jsonb_build_object(
        'order_number', missed_order.order_number,
        'original_scheduled_date', missed_order.scheduled_delivery_date
      )
    );
  END LOOP;
END;
$$;