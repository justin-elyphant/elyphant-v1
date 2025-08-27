-- Fix auto-approve setting by creating missing settings record and updating execution status

-- Step 1: Insert missing auto_gifting_settings record with auto_approve_gifts enabled
INSERT INTO public.auto_gifting_settings (
  user_id,
  auto_approve_gifts,
  default_budget_limit,
  default_notification_days,
  email_notifications,
  push_notifications,
  default_gift_source,
  has_payment_method,
  budget_tracking
) VALUES (
  '0478a7d7-9d59-40bf-954e-657fa28fe251', -- Correct user ID
  true, -- Enable auto-approve to match UI toggle
  50,
  ARRAY[7, 3, 1],
  true,
  false,
  'wishlist',
  false,
  '{"monthly_limit": null, "annual_limit": null, "spent_this_month": 0, "spent_this_year": 0}'::jsonb
)
ON CONFLICT (user_id) DO UPDATE SET
  auto_approve_gifts = true,
  updated_at = now();

-- Step 2: Update current pending_approval execution to pending status
UPDATE public.automated_gift_executions 
SET 
  status = 'pending',
  updated_at = now()
WHERE user_id = '0478a7d7-9d59-40bf-954e-657fa28fe251' 
  AND status = 'pending_approval';