
-- Drop and recreate beta_credits policies to allow 'employee' role
DROP POLICY IF EXISTS "Employees can insert credits" ON public.beta_credits;
DROP POLICY IF EXISTS "Employees can update credits" ON public.beta_credits;
DROP POLICY IF EXISTS "Employees can view all credits" ON public.beta_credits;

CREATE POLICY "Employees can insert credits" ON public.beta_credits
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'employee'::app_role));

CREATE POLICY "Employees can update credits" ON public.beta_credits
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'employee'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'employee'::app_role));

CREATE POLICY "Employees can view all credits" ON public.beta_credits
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'employee'::app_role));
