
-- ============================================================
-- PHASE 3B: Fix search_path on ALL SECURITY DEFINER functions
-- Uses DO block to handle any signature mismatches gracefully
-- ============================================================

DO $$
DECLARE
  func_record RECORD;
BEGIN
  FOR func_record IN
    SELECT oid, proname, pg_get_function_identity_arguments(oid) as args
    FROM pg_proc
    WHERE prosecdef = true
      AND pronamespace = 'public'::regnamespace
      AND EXISTS (SELECT 1 FROM unnest(proconfig) cfg WHERE cfg = 'search_path=public')
  LOOP
    EXECUTE format(
      'ALTER FUNCTION public.%I(%s) SET search_path = %L',
      func_record.proname,
      func_record.args,
      ''
    );
    RAISE NOTICE 'Fixed: %.%(%)', 'public', func_record.proname, func_record.args;
  END LOOP;
END $$;
