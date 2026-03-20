CREATE OR REPLACE FUNCTION public.get_suggested_connections(
  requesting_user_id uuid,
  user_interests text[] DEFAULT '{}',
  suggestion_limit int DEFAULT 15
)
RETURNS TABLE(
  id uuid,
  name text,
  username text,
  profile_image text,
  bio text,
  city text,
  state text,
  mutual_count bigint,
  common_interests int
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
  all_connected AS (
    SELECT 
      CASE WHEN uc.user_id = requesting_user_id THEN uc.connected_user_id ELSE uc.user_id END AS connected_id
    FROM user_connections uc
    WHERE uc.user_id = requesting_user_id OR uc.connected_user_id = requesting_user_id
  ),
  friends_of_friends AS (
    SELECT 
      CASE WHEN uc.user_id = mf.friend_id THEN uc.connected_user_id ELSE uc.user_id END AS fof_id,
      COUNT(DISTINCT mf.friend_id) AS mutual_count
    FROM user_connections uc
    JOIN my_friends mf ON (uc.user_id = mf.friend_id OR uc.connected_user_id = mf.friend_id)
    WHERE uc.status = 'accepted'
      AND CASE WHEN uc.user_id = mf.friend_id THEN uc.connected_user_id ELSE uc.user_id END != requesting_user_id
      AND CASE WHEN uc.user_id = mf.friend_id THEN uc.connected_user_id ELSE uc.user_id END NOT IN (SELECT connected_id FROM all_connected)
    GROUP BY fof_id
  ),
  has_friends AS (
    SELECT EXISTS (SELECT 1 FROM my_friends) AS val
  ),
  cold_start_candidates AS (
    SELECT 
      p.id AS candidate_id,
      0::bigint AS mutual_count
    FROM profiles p
    WHERE NOT EXISTS (SELECT 1 FROM has_friends WHERE val = true)
      AND p.id != requesting_user_id
      AND p.id NOT IN (SELECT connected_id FROM all_connected)
      AND NOT EXISTS (
        SELECT 1 FROM blocked_users bu
        WHERE (bu.blocker_id = requesting_user_id AND bu.blocked_id = p.id)
           OR (bu.blocker_id = p.id AND bu.blocked_id = requesting_user_id)
      )
  ),
  combined AS (
    SELECT fof_id AS candidate_id, mutual_count FROM friends_of_friends
    UNION ALL
    SELECT candidate_id, mutual_count FROM cold_start_candidates
  ),
  not_blocked AS (
    SELECT c.candidate_id, c.mutual_count
    FROM combined c
    WHERE NOT EXISTS (
      SELECT 1 FROM blocked_users bu
      WHERE (bu.blocker_id = requesting_user_id AND bu.blocked_id = c.candidate_id)
         OR (bu.blocker_id = c.candidate_id AND bu.blocked_id = requesting_user_id)
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
    nb.mutual_count,
    (SELECT COUNT(*)::int FROM (
      SELECT jsonb_array_elements_text(COALESCE(p.interests, '[]'::jsonb))
      INTERSECT
      SELECT unnest(user_interests)
    ) sub) AS common_interests
  FROM not_blocked nb
  JOIN profiles p ON p.id = nb.candidate_id
  ORDER BY 
    nb.mutual_count DESC,
    (SELECT COUNT(*)::int FROM (
      SELECT jsonb_array_elements_text(COALESCE(p.interests, '[]'::jsonb))
      INTERSECT
      SELECT unnest(user_interests)
    ) sub2) DESC,
    CASE WHEN p.profile_image IS NOT NULL THEN 0 ELSE 1 END,
    p.name ASC
  LIMIT suggestion_limit;
$$;