-- Create vendor accounts table for approved vendors
CREATE TABLE public.vendor_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  approval_status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on vendor accounts
ALTER TABLE public.vendor_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for vendor accounts
CREATE POLICY "Vendors can view their own account" 
ON public.vendor_accounts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage vendor accounts" 
ON public.vendor_accounts 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create function to check vendor portal access
CREATE OR REPLACE FUNCTION public.can_access_vendor_portal(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_email text;
  is_approved_vendor boolean;
BEGIN
  -- Get user email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = user_uuid;
  
  -- Check if user is an approved vendor
  SELECT EXISTS (
    SELECT 1 FROM public.vendor_accounts
    WHERE user_id = user_uuid 
    AND approval_status = 'approved'
  ) INTO is_approved_vendor;
  
  RETURN is_approved_vendor;
END;
$function$;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_vendor_accounts_updated_at
BEFORE UPDATE ON public.vendor_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();