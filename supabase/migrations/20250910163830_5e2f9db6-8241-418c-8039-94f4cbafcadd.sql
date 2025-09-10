-- Enhanced User Identification & Data Protection System
-- Add user type and signup source tracking

-- Create enum for user types
CREATE TYPE public.user_type AS ENUM ('shopper', 'vendor', 'employee');

-- Create enum for signup sources  
CREATE TYPE public.signup_source AS ENUM ('header_cta', 'vendor_portal', 'trunkline', 'social_auth', 'direct', 'invite');

-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_type public.user_type DEFAULT 'shopper',
ADD COLUMN IF NOT EXISTS signup_source public.signup_source DEFAULT 'direct',
ADD COLUMN IF NOT EXISTS signup_metadata jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS source_attribution jsonb DEFAULT '{}';

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON public.profiles (user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_signup_source ON public.profiles (signup_source);
CREATE INDEX IF NOT EXISTS idx_profiles_user_type_source ON public.profiles (user_type, signup_source);

-- Enhanced access control function
CREATE OR REPLACE FUNCTION public.get_user_context(check_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_info jsonb;
  user_email text;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = check_user_id;
  
  -- Get user profile info
  SELECT jsonb_build_object(
    'user_type', COALESCE(user_type, 'shopper'),
    'signup_source', COALESCE(signup_source, 'direct'),
    'is_employee', COALESCE(user_type, 'shopper') = 'employee',
    'is_vendor', COALESCE(user_type, 'shopper') = 'vendor',
    'is_shopper', COALESCE(user_type, 'shopper') = 'shopper',
    'signup_metadata', COALESCE(signup_metadata, '{}'),
    'source_attribution', COALESCE(source_attribution, '{}')
  ) INTO user_info
  FROM public.profiles
  WHERE id = check_user_id;
  
  -- If no profile found, return default shopper context
  IF user_info IS NULL THEN
    user_info := jsonb_build_object(
      'user_type', 'shopper',
      'signup_source', 'direct',
      'is_employee', false,
      'is_vendor', false,
      'is_shopper', true,
      'signup_metadata', '{}',
      'source_attribution', '{}'
    );
  END IF;
  
  RETURN user_info;
END;
$$;

-- Enhanced vendor portal access function
CREATE OR REPLACE FUNCTION public.can_access_vendor_portal(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_context jsonb;
  is_approved_vendor boolean;
BEGIN
  -- Get user context
  user_context := public.get_user_context(user_uuid);
  
  -- Check if user type is vendor
  IF (user_context->>'is_vendor')::boolean = false THEN
    RETURN false;
  END IF;
  
  -- Check if user is an approved vendor
  SELECT EXISTS (
    SELECT 1 FROM public.vendor_accounts
    WHERE user_id = user_uuid 
    AND approval_status = 'approved'
  ) INTO is_approved_vendor;
  
  RETURN is_approved_vendor;
END;
$$;

-- Enhanced trunkline access function
CREATE OR REPLACE FUNCTION public.can_access_trunkline(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_context jsonb;
  user_email text;
  is_business_admin boolean;
BEGIN
  -- Get user context
  user_context := public.get_user_context(user_uuid);
  
  -- Check if user type is employee
  IF (user_context->>'is_employee')::boolean = false THEN
    RETURN false;
  END IF;
  
  -- Get user email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_uuid;
  
  -- Check if user has elyphant.com email
  IF NOT public.is_elyphant_domain(user_email) THEN
    RETURN false;
  END IF;
  
  -- Check if user is in business_admins table
  SELECT EXISTS (
    SELECT 1 FROM public.business_admins
    WHERE user_id = user_uuid
  ) INTO is_business_admin;
  
  RETURN is_business_admin;
END;
$$;

-- Function to set user type and source during signup
CREATE OR REPLACE FUNCTION public.set_user_identification(
  target_user_id uuid,
  user_type_param public.user_type,
  signup_source_param public.signup_source,
  metadata_param jsonb DEFAULT '{}',
  attribution_param jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    user_type = user_type_param,
    signup_source = signup_source_param,
    signup_metadata = COALESCE(signup_metadata, '{}') || metadata_param,
    source_attribution = COALESCE(source_attribution, '{}') || attribution_param,
    updated_at = now()
  WHERE id = target_user_id;
  
  -- If no profile exists, this shouldn't happen but let's be safe
  IF NOT FOUND THEN
    INSERT INTO public.profiles (
      id, user_type, signup_source, signup_metadata, source_attribution
    ) VALUES (
      target_user_id, user_type_param, signup_source_param, metadata_param, attribution_param
    ) ON CONFLICT (id) DO UPDATE SET
      user_type = user_type_param,
      signup_source = signup_source_param,
      signup_metadata = COALESCE(profiles.signup_metadata, '{}') || metadata_param,
      source_attribution = COALESCE(profiles.source_attribution, '{}') || attribution_param,
      updated_at = now();
  END IF;
END;
$$;

-- Backfill existing users
-- First, mark elyphant.com emails as employees
UPDATE public.profiles 
SET user_type = 'employee', signup_source = 'trunkline'
WHERE id IN (
  SELECT p.id 
  FROM public.profiles p
  JOIN auth.users au ON p.id = au.id
  WHERE au.email ILIKE '%@elyphant.com'
);

-- Mark users with vendor accounts as vendors
UPDATE public.profiles 
SET user_type = 'vendor', signup_source = 'vendor_portal'
WHERE id IN (
  SELECT user_id FROM public.vendor_accounts
);

-- All others remain as shoppers (already default)

-- Enhanced RLS policies for user-type isolation

-- Update business_admins policies to check user type
DROP POLICY IF EXISTS "Business admins can view admin list" ON public.business_admins;
CREATE POLICY "Business admins can view admin list" 
ON public.business_admins 
FOR SELECT 
USING (
  is_business_admin(auth.uid()) AND 
  (public.get_user_context(auth.uid())->>'is_employee')::boolean = true
);

-- Update vendor_accounts policies to check user type
DROP POLICY IF EXISTS "Approved vendors can view vendor accounts" ON public.vendor_accounts;
CREATE POLICY "Approved vendors can view vendor accounts" 
ON public.vendor_accounts 
FOR SELECT 
USING (
  (auth.uid() = user_id) OR 
  (can_access_vendor_portal(auth.uid()) AND (public.get_user_context(auth.uid())->>'is_vendor')::boolean = true)
);

-- Audit logging for user type changes
CREATE TABLE IF NOT EXISTS public.user_type_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  old_user_type text,
  new_user_type text,
  changed_by uuid,
  change_reason text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.user_type_audit_log ENABLE ROW LEVEL SECURITY;

-- Only business admins can view audit logs
CREATE POLICY "Business admins can view user type audit logs" 
ON public.user_type_audit_log 
FOR SELECT 
USING (
  is_business_admin(auth.uid()) AND 
  (public.get_user_context(auth.uid())->>'is_employee')::boolean = true
);

-- Function to log user type changes
CREATE OR REPLACE FUNCTION public.log_user_type_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.user_type IS DISTINCT FROM NEW.user_type THEN
    INSERT INTO public.user_type_audit_log (
      user_id, old_user_type, new_user_type, changed_by, change_reason, metadata
    ) VALUES (
      NEW.id, 
      OLD.user_type::text, 
      NEW.user_type::text, 
      auth.uid(),
      'Profile update',
      jsonb_build_object(
        'old_signup_source', OLD.signup_source,
        'new_signup_source', NEW.signup_source,
        'timestamp', now()
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for user type changes
DROP TRIGGER IF EXISTS log_user_type_changes ON public.profiles;
CREATE TRIGGER log_user_type_changes
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.log_user_type_change();