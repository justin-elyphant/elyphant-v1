-- Phase 1: Critical Security Migration - User Roles System

-- 1. Create role enum
CREATE TYPE app_role AS ENUM ('admin', 'vendor', 'employee', 'customer');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    granted_at timestamp with time zone DEFAULT now(),
    granted_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 5. Create RLS policies
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage all roles"
ON public.user_roles FOR ALL
TO service_role
USING (true);

-- 6. Create index for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- 7. Migrate existing data from profiles table
-- Employees (based on user_type = 'employee' OR profile_type = 'employee')
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT id, 'employee'::app_role
FROM public.profiles
WHERE user_type = 'employee' OR profile_type = 'employee'
ON CONFLICT (user_id, role) DO NOTHING;

-- Vendors (based on approved vendor_accounts)
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT user_id, 'vendor'::app_role
FROM public.vendor_accounts
WHERE approval_status = 'approved'
ON CONFLICT (user_id, role) DO NOTHING;

-- Customers (everyone who is a shopper or has made any activity)
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT id, 'customer'::app_role
FROM public.profiles
WHERE user_type = 'shopper' 
   OR profile_type IN ('giftor', 'giftee', 'customer')
   OR user_type IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- 8. Add helpful comment
COMMENT ON TABLE public.user_roles IS 'Secure role-based access control. Use has_role() function in RLS policies to check permissions.';