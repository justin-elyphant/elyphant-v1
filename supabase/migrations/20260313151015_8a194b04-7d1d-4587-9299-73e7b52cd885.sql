-- One-time data fix: Update pending_invitation records to pending where connected_user_id is not null (user already exists on platform)
UPDATE public.user_connections 
SET status = 'pending' 
WHERE status = 'pending_invitation' 
AND connected_user_id IS NOT NULL;