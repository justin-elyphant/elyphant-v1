-- Create RPC function for atomic group gift amount increment
-- This prevents race conditions when multiple contributors pay simultaneously

CREATE OR REPLACE FUNCTION increment_group_gift_amount(
  project_id uuid,
  amount numeric
) RETURNS void AS $$
BEGIN
  UPDATE group_gift_projects
  SET current_amount = current_amount + amount,
      updated_at = now()
  WHERE id = project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;