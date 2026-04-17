CREATE OR REPLACE FUNCTION public.get_remaining_invites(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_is_seeder boolean;
  v_bonus integer;
  v_used integer;
  v_base_cap integer := 2;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;
  v_is_seeder := v_email IS NOT NULL AND lower(v_email) LIKE '%@elyphant.com';

  IF v_is_seeder THEN
    RETURN -1; -- unlimited
  END IF;

  SELECT COALESCE(bonus_invites, 0) INTO v_bonus
  FROM public.beta_invite_limits
  WHERE user_id = p_user_id;
  v_bonus := COALESCE(v_bonus, 0);

  SELECT COUNT(*) INTO v_used
  FROM public.beta_referrals
  WHERE referrer_id = p_user_id AND status = 'credit_issued';

  RETURN GREATEST(v_base_cap + v_bonus - v_used, 0);
END;
$$;