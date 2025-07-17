-- Clean up duplicate pending connections by keeping only the most recent one per email
WITH ranked_connections AS (
  SELECT id, 
         ROW_NUMBER() OVER (
           PARTITION BY user_id, pending_recipient_email, status 
           ORDER BY created_at DESC
         ) as rn
  FROM user_connections 
  WHERE status = 'pending_invitation' 
  AND pending_recipient_email IS NOT NULL
)
DELETE FROM user_connections 
WHERE id IN (
  SELECT id 
  FROM ranked_connections 
  WHERE rn > 1
);