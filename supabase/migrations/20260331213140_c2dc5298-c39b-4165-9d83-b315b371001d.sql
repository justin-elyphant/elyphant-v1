
-- Beta feedback table
CREATE TABLE public.beta_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature_area TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;

-- Authenticated users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
  ON public.beta_feedback FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all feedback (using business_admins table)
CREATE POLICY "Admins can read all feedback"
  ON public.beta_feedback FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.business_admins WHERE user_id = auth.uid()));

-- Beta feedback tokens table
CREATE TABLE public.beta_feedback_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.beta_feedback_tokens ENABLE ROW LEVEL SECURITY;

-- No public access to tokens; only service role creates them
-- Admins can view tokens for debugging
CREATE POLICY "Admins can read tokens"
  ON public.beta_feedback_tokens FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.business_admins WHERE user_id = auth.uid()));

-- RPC to validate token (security definer bypasses RLS)
CREATE OR REPLACE FUNCTION public.validate_beta_feedback_token(p_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  token_record RECORD;
BEGIN
  SELECT bft.user_id, bft.expires_at, bft.used_at, p.name, p.email
  INTO token_record
  FROM beta_feedback_tokens bft
  LEFT JOIN profiles p ON p.id = bft.user_id
  WHERE bft.token = p_token;

  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'Token not found');
  END IF;

  IF token_record.used_at IS NOT NULL THEN
    RETURN json_build_object('valid', false, 'error', 'Token already used');
  END IF;

  IF token_record.expires_at < now() THEN
    RETURN json_build_object('valid', false, 'error', 'Token expired');
  END IF;

  RETURN json_build_object(
    'valid', true,
    'user_id', token_record.user_id,
    'name', token_record.name,
    'email', token_record.email
  );
END;
$$;

-- RPC to submit feedback (security definer so unauthenticated token-holders can submit)
CREATE OR REPLACE FUNCTION public.submit_beta_feedback(
  p_token UUID,
  p_feedback JSON
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  token_record RECORD;
  fb JSON;
BEGIN
  -- Validate token
  SELECT user_id, expires_at, used_at INTO token_record
  FROM beta_feedback_tokens WHERE token = p_token;

  IF NOT FOUND OR token_record.used_at IS NOT NULL OR token_record.expires_at < now() THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired token');
  END IF;

  -- Insert feedback entries
  FOR fb IN SELECT * FROM json_array_elements(p_feedback)
  LOOP
    INSERT INTO beta_feedback (user_id, feature_area, rating, feedback_text)
    VALUES (
      token_record.user_id,
      fb->>'feature_area',
      (fb->>'rating')::integer,
      fb->>'feedback_text'
    );
  END LOOP;

  -- Mark token as used
  UPDATE beta_feedback_tokens SET used_at = now() WHERE token = p_token;

  RETURN json_build_object('success', true);
END;
$$;
