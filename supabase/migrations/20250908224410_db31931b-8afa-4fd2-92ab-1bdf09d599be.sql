-- Add missing DELETE policy for business admins to manually delete profiles
CREATE POLICY "Business admins can delete any profile" 
ON public.profiles 
FOR DELETE 
USING (is_business_admin(auth.uid()));