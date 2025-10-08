-- Remove mike_scott3@gmail.com from business_admins
DELETE FROM public.business_admins 
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'mike_scott3@gmail.com'
);

-- Add DELETE policy for business admins on orders table
CREATE POLICY "Business admins can delete orders"
ON public.orders
FOR DELETE
TO authenticated
USING (is_business_admin(auth.uid()));