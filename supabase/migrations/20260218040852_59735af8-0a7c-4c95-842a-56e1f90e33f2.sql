
-- FIX: Guest order access - add 30-day expiry
DROP POLICY IF EXISTS "Guests can view their orders by session" ON orders;
DROP POLICY IF EXISTS "Guests can view recent orders by session" ON orders;

CREATE POLICY "Guests can view recent orders by session"
ON orders FOR SELECT
USING (
  user_id IS NULL 
  AND checkout_session_id IS NOT NULL
  AND created_at > (NOW() - INTERVAL '30 days')
);
