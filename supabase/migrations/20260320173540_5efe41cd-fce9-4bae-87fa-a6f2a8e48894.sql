
CREATE OR REPLACE FUNCTION public.get_suggested_connections(requesting_user_id uuid, suggestion_limit int DEFAULT 6)
RETURNS TABLE(
  id uuid,
  name text,
  username text,
  profile_image text,
  bio text,
  city text,
  state text,
  mutual_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH my_friends AS (
    SELECT 
      CASE WHEN uc.user_id = requesting_user_id THEN uc.connected_user_id ELSE uc.user_id END AS friend_id
    FROM user_connections uc
    WHERE (uc.user_id = requesting_user_id OR uc.connected_user_id = requesting_user_id)
      AND uc.status = 'accepted'
  ),
  friends_of_friends AS (
    SELECT 
      CASE WHEN uc.user_id = mf.friend_id THEN uc.connected_user_id ELSE uc.user_id END AS fof_id,
      COUNT(DISTINCT mf.friend_id) AS mutual_count
    FROM user_connections uc
    JOIN my_friends mf ON (uc.user_id = mf.friend_id OR uc.connected_user_id = mf.friend_id)
    WHERE uc.status = 'accepted'
      AND CASE WHEN uc.user_id = mf.friend_id THEN uc.connected_user_id ELSE uc.user_id END != requesting_user_id
      AND CASE WHEN uc.user_id = mf.friend_id THEN uc.connected_user_id ELSE uc.user_id END NOT IN (SELECT friend_id FROM my_friends)
    GROUP BY fof_id
  ),
  not_blocked AS (
    SELECT fof.fof_id, fof.mutual_count
    FROM friends_of_friends fof
    WHERE NOT EXISTS (
      SELECT 1 FROM blocked_users bu
      WHERE (bu.blocker_id = requesting_user_id AND bu.blocked_id = fof.fof_id)
         OR (bu.blocker_id = fof.fof_id AND bu.blocked_id = requesting_user_id)
    )
  )
  SELECT 
    p.id,
    p.name,
    p.username,
    p.profile_image,
    p.bio,
    p.city,
    p.state,
    nb.mutual_count
  FROM not_blocked nb
  JOIN profiles p ON p.id = nb.fof_id
  ORDER BY nb.mutual_count DESC, p.name ASC
  LIMIT suggestion_limit;
$$;
