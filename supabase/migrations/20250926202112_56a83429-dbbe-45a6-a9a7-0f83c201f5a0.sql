-- Align logging schema to existing tables and add missing utilities safely

-- 1) Ensure scheduled_order_alerts has updated_at and trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='scheduled_order_alerts' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public.scheduled_order_alerts 
      ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
END$$;

-- Create trigger only if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_scheduled_order_alerts_updated_at'
  ) THEN
    CREATE TRIGGER trg_scheduled_order_alerts_updated_at
      BEFORE UPDATE ON public.scheduled_order_alerts
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- 2) Ensure manual_processing_logs table exists
CREATE TABLE IF NOT EXISTS public.manual_processing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID,
  action_type TEXT NOT NULL CHECK (action_type IN ('manual_trigger', 'date_manipulation', 'debug_query', 'force_retry', 'resolve_alert')),
  target_order_id UUID REFERENCES public.orders(id),
  action_details JSONB NOT NULL DEFAULT '{}',
  result JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) Helpful indexes
CREATE INDEX IF NOT EXISTS idx_cron_exec_job_started ON public.cron_execution_logs(cron_job_name, execution_started_at DESC);
CREATE INDEX IF NOT EXISTS idx_cron_exec_status_started ON public.cron_execution_logs(status, execution_started_at DESC);
CREATE INDEX IF NOT EXISTS idx_scheduled_alerts_unresolved ON public.scheduled_order_alerts(is_resolved, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_manual_processing_logs_admin_time ON public.manual_processing_logs(admin_user_id, created_at DESC);

-- 4) Enable RLS (idempotent)
ALTER TABLE public.cron_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_order_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_processing_logs ENABLE ROW LEVEL SECURITY;

-- 5) Policies for business admins (create if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='cron_execution_logs' AND policyname='Business admins can view cron execution logs'
  ) THEN
    CREATE POLICY "Business admins can view cron execution logs"
    ON public.cron_execution_logs FOR ALL
    USING (public.is_business_admin(auth.uid()));
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='scheduled_order_alerts' AND policyname='Business admins can view scheduled order alerts'
  ) THEN
    CREATE POLICY "Business admins can view scheduled order alerts"
    ON public.scheduled_order_alerts FOR ALL
    USING (public.is_business_admin(auth.uid()));
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='manual_processing_logs' AND policyname='Business admins can view manual processing logs'
  ) THEN
    CREATE POLICY "Business admins can view manual processing logs"
    ON public.manual_processing_logs FOR ALL
    USING (public.is_business_admin(auth.uid()));
  END IF;
END$$;