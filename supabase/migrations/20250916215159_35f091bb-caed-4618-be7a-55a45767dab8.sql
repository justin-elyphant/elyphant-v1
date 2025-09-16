-- Fix Security Definer View lint by enforcing SECURITY INVOKER on views
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE c.relkind='v' AND n.nspname='public' AND c.relname='order_monitoring_summary'
  ) THEN
    ALTER VIEW public.order_monitoring_summary SET (security_invoker = on);
    COMMENT ON VIEW public.order_monitoring_summary IS 'SECURITY INVOKER enabled to ensure underlying RLS and user permissions are enforced; avoids definer semantics flagged by linter 0010.';
  END IF;
END $$;