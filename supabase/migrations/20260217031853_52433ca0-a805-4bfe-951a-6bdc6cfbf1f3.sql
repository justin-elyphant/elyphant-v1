CREATE POLICY "Guests can view their orders by session"
  ON orders FOR SELECT
  USING (user_id IS NULL AND checkout_session_id IS NOT NULL);