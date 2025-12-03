-- ONE-TIME CLEANUP: Delete old and duplicate sessions
-- Step 1: Delete all inactive sessions older than 14 days
DELETE FROM user_sessions 
WHERE is_active = false AND last_activity_at < now() - INTERVAL '14 days';

-- Step 2: Delete ALL sessions older than 30 days
DELETE FROM user_sessions 
WHERE created_at < now() - INTERVAL '30 days';

-- Step 3: Delete duplicate sessions per user+device (keep most recent)
DELETE FROM user_sessions WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (
             PARTITION BY user_id, device_fingerprint 
             ORDER BY last_activity_at DESC
           ) as rn
    FROM user_sessions
  ) ranked 
  WHERE rn > 1
);

-- Step 4: Keep only last 10 sessions per user
DELETE FROM user_sessions WHERE id IN (
  SELECT id FROM (
    SELECT id, 
           ROW_NUMBER() OVER (
             PARTITION BY user_id 
             ORDER BY last_activity_at DESC
           ) as rn
    FROM user_sessions
  ) ranked 
  WHERE rn > 10
);

-- UPDATE cleanup function with new retention policy
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Step 1: Mark sessions inactive after 7 days of no activity
  UPDATE user_sessions 
  SET is_active = false
  WHERE last_activity_at < now() - INTERVAL '7 days' 
    AND is_active = true;

  -- Step 2: Delete inactive sessions older than 14 days
  DELETE FROM user_sessions 
  WHERE is_active = false 
    AND last_activity_at < now() - INTERVAL '14 days';

  -- Step 3: Delete ALL sessions older than 30 days
  DELETE FROM user_sessions 
  WHERE created_at < now() - INTERVAL '30 days';

  -- Step 4: Delete duplicate sessions per user+device (keep most recent)
  DELETE FROM user_sessions WHERE id IN (
    SELECT id FROM (
      SELECT id, 
             ROW_NUMBER() OVER (
               PARTITION BY user_id, device_fingerprint 
               ORDER BY last_activity_at DESC
             ) as rn
      FROM user_sessions
    ) ranked 
    WHERE rn > 1
  );

  -- Step 5: Keep only last 10 sessions per user
  DELETE FROM user_sessions WHERE id IN (
    SELECT id FROM (
      SELECT id, 
             ROW_NUMBER() OVER (
               PARTITION BY user_id 
               ORDER BY last_activity_at DESC
             ) as rn
      FROM user_sessions
    ) ranked 
    WHERE rn > 10
  );
END;
$$;