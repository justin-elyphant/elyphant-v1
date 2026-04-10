
CREATE OR REPLACE FUNCTION public.get_beta_tester_analytics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result json;
BEGIN
  WITH beta_testers AS (
    SELECT DISTINCT bc.user_id
    FROM public.beta_credits bc
    WHERE bc.type = 'issued'
  ),
  funnel AS (
    SELECT
      (SELECT count(*) FROM beta_testers) as signed_up,
      (SELECT count(DISTINCT bt.user_id) FROM beta_testers bt JOIN public.wishlists w ON w.user_id = bt.user_id) as built_wishlist,
      (SELECT count(DISTINCT bt.user_id) FROM beta_testers bt JOIN public.beta_referrals br ON br.referrer_id = bt.user_id) as invited_friend,
      (SELECT count(DISTINCT bt.user_id) FROM beta_testers bt JOIN public.orders o ON o.user_id = bt.user_id WHERE o.scheduled_delivery_date IS NOT NULL) as scheduled_gift,
      (SELECT count(DISTINCT bc.user_id) FROM public.beta_credits bc WHERE bc.type = 'spent') as made_purchase
  ),
  engagement AS (
    SELECT
      COALESCE(
        (SELECT count(*)::numeric FROM public.orders o JOIN beta_testers bt ON o.user_id = bt.user_id) /
        NULLIF((SELECT count(*) FROM beta_testers), 0),
        0
      ) as avg_orders_per_tester,
      COALESCE(
        (SELECT sum(abs(amount)) FROM public.beta_credits WHERE type = 'spent') * 100.0 /
        NULLIF((SELECT sum(amount) FROM public.beta_credits WHERE type = 'issued'), 0),
        0
      ) as credit_utilization_pct,
      (SELECT count(DISTINCT bt.user_id) FROM beta_testers bt
       JOIN public.user_interaction_events uie ON uie.user_id = bt.user_id
       WHERE uie.created_at > now() - interval '7 days') as active_last_7_days,
      (SELECT count(*) FROM beta_testers) as total_testers
  ),
  feature_usage AS (
    SELECT json_agg(row_to_json(fu)) as features FROM (
      SELECT
        uie.event_type as feature,
        count(*) as usage_count,
        count(DISTINCT uie.user_id) as unique_users
      FROM public.user_interaction_events uie
      JOIN beta_testers bt ON uie.user_id = bt.user_id
      WHERE uie.created_at > now() - interval '30 days'
      GROUP BY uie.event_type
      ORDER BY usage_count DESC
      LIMIT 20
    ) fu
  ),
  per_tester AS (
    SELECT json_agg(row_to_json(pt)) as testers FROM (
      SELECT
        bt.user_id,
        p.name,
        p.email,
        (SELECT max(uie.created_at) FROM public.user_interaction_events uie WHERE uie.user_id = bt.user_id) as last_active,
        (SELECT count(*) FROM public.wishlists w WHERE w.user_id = bt.user_id) as wishlist_count,
        (SELECT count(*) FROM public.orders o WHERE o.user_id = bt.user_id) as order_count,
        (SELECT count(DISTINCT uie.event_type) FROM public.user_interaction_events uie WHERE uie.user_id = bt.user_id) as features_used,
        EXISTS(SELECT 1 FROM public.wishlists w WHERE w.user_id = bt.user_id) as has_wishlist,
        EXISTS(SELECT 1 FROM public.beta_referrals br WHERE br.referrer_id = bt.user_id) as has_invited,
        EXISTS(SELECT 1 FROM public.orders o WHERE o.user_id = bt.user_id AND o.scheduled_delivery_date IS NOT NULL) as has_scheduled_gift,
        EXISTS(SELECT 1 FROM public.beta_credits bc WHERE bc.user_id = bt.user_id AND bc.type = 'spent') as has_purchased
      FROM beta_testers bt
      LEFT JOIN public.profiles p ON p.id = bt.user_id
      ORDER BY last_active DESC NULLS LAST
    ) pt
  )
  SELECT json_build_object(
    'funnel', (SELECT row_to_json(f) FROM funnel f),
    'engagement', (SELECT row_to_json(e) FROM engagement e),
    'feature_usage', (SELECT features FROM feature_usage),
    'per_tester', (SELECT testers FROM per_tester)
  ) INTO result;

  RETURN result;
END;
$$;
