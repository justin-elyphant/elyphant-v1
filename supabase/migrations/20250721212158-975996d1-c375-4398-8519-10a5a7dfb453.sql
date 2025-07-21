-- Drop the previous policy that wasn't complete
DROP POLICY IF EXISTS "Recipients can update connection requests" ON public.user_connections;

-- Create a comprehensive policy for recipients to accept/reject requests
CREATE POLICY "Recipients can accept or reject connection requests" 
ON public.user_connections 
FOR UPDATE 
USING (auth.uid() = connected_user_id AND status = 'pending')
WITH CHECK (auth.uid() = connected_user_id AND status IN ('accepted', 'rejected'));