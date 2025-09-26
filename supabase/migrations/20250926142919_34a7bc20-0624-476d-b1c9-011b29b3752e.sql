-- Create cron execution tracking table
CREATE TABLE IF NOT EXISTS public.cron_execution_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  cron_job_name text NOT NULL,
  execution_started_at timestamp with time zone DEFAULT now(),
  execution_completed_at timestamp with time zone,
  status text NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
  orders_processed integer DEFAULT 0,
  success_count integer DEFAULT 0,
  failure_count integer DEFAULT 0,
  error_message text,
  execution_metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Create admin alerts for missed scheduled orders
CREATE TABLE IF NOT EXISTS public.scheduled_order_alerts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type text NOT NULL, -- 'missed_processing', 'cron_failure', 'order_overdue'
  order_id uuid,
  scheduled_delivery_date date,
  days_overdue integer,
  alert_message text NOT NULL,
  is_resolved boolean DEFAULT false,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE public.cron_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_order_alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin access
CREATE POLICY "Admin access to cron logs" ON public.cron_execution_logs
FOR ALL USING (is_business_admin(auth.uid()));

CREATE POLICY "Admin access to scheduled order alerts" ON public.scheduled_order_alerts
FOR ALL USING (is_business_admin(auth.uid()));

-- Function to check for missed scheduled orders and create alerts
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