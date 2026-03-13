
CREATE OR REPLACE FUNCTION public.get_mutual_friends_count(user_a uuid, user_b uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer
  FROM (
    -- user_a's accepted connections
    SELECT CASE WHEN user_id = user_a THEN connected_user_id ELSE user_id END AS friend_id
    FROM user_connections
    WHERE status = 'accepted'
      AND (user_id = user_a OR connected_user_id = user_a)
  ) a
  INNER JOIN (
    -- user_b's accepted connections
    SELECT CASE WHEN user_id = user_b THEN connected_user_id ELSE user_id END AS friend_id
    FROM user_connections
    WHERE status = 'accepted'
      AND (user_id = user_b OR connected_user_id = user_b)
  ) b ON a.friend_id = b.friend_id;
$$;
