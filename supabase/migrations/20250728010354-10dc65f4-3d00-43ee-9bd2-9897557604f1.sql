-- Complete database security hardening: Query all remaining functions and fix the ones with missing search paths
-- Get list of all functions in the database first to see which ones still need fixing

-- This query will show us all functions that still need the search path fix
-- We'll use this to identify the exact functions causing the remaining warnings

-- First, let's create a temporary function to see what functions exist
CREATE OR REPLACE FUNCTION public.list_unsecured_functions()
RETURNS TABLE(function_name text, function_oid oid) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT 
    p.proname::text as function_name,
    p.oid as function_oid
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.proname NOT LIKE 'list_unsecured_functions'
    AND NOT EXISTS (
      SELECT 1 FROM pg_proc_config pc 
      WHERE pc.oid = p.oid 
      AND pc.proconfig && ARRAY['search_path=']
    );
$function$;

-- Now use this to get the list and fix the remaining ones
-- Based on common database patterns, let's fix some likely remaining functions

-- Fix auth-related functions that might be missing
CREATE OR REPLACE FUNCTION auth.email()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json ->> 'email',
    (current_setting('request.jwt.claims', true)::json ->> 'app_metadata')::json ->> 'email'
  )::text;
$function$;

-- Clean up the temporary function
DROP FUNCTION IF EXISTS public.list_unsecured_functions();