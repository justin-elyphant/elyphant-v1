-- Allow recipients to accept/reject connection requests
CREATE POLICY "Recipients can update connection requests" 
ON public.user_connections 
FOR UPDATE 
USING (auth.uid() = connected_user_id AND status = 'pending');