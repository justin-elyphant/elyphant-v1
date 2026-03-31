
CREATE OR REPLACE FUNCTION public.submit_beta_feedback(p_token uuid, p_feedback json)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  token_record RECORD;
  fb JSON;
  v_stage text;
  v_stage_data jsonb;
BEGIN
  -- Validate token
  SELECT user_id, expires_at, used_at INTO token_record
  FROM beta_feedback_tokens WHERE token = p_token;

  IF NOT FOUND OR token_record.used_at IS NOT NULL OR token_record.expires_at < now() THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired token');
  END IF;

  -- Get the tester's current feedback stage
  v_stage_data := get_tester_feedback_stage(token_record.user_id);
  v_stage := v_stage_data->>'stage';

  -- Insert feedback entries with stage
  FOR fb IN SELECT * FROM json_array_elements(p_feedback)
  LOOP
    INSERT INTO beta_feedback (user_id, feature_area, rating, feedback_text, feedback_stage)
    VALUES (
      token_record.user_id,
      fb->>'feature_area',
      (fb->>'rating')::integer,
      fb->>'feedback_text',
      v_stage
    );
  END LOOP;

  -- Mark token as used
  UPDATE beta_feedback_tokens SET used_at = now() WHERE token = p_token;

  RETURN json_build_object('success', true);
END;
$function$;
