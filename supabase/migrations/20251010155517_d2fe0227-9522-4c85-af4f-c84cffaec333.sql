-- ============================================
-- IMMEDIATE FIX: Stop Email Storm
-- ============================================

-- Drop the problematic trigger that calls orchestrator directly
DROP TRIGGER IF EXISTS order_email_trigger ON orders;
DROP FUNCTION IF EXISTS trigger_order_emails();

-- Create new queue-based trigger (reuses existing email_queue)
CREATE OR REPLACE FUNCTION public.queue_order_emails()
RETURNS TRIGGER AS $$
BEGIN
  -- Only queue for successful payments
  IF NEW.payment_status = 'succeeded' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'succeeded') THEN
    
    -- Insert into email_queue (deduplication handled by unique index)
    INSERT INTO public.email_queue (
      recipient_email,
      recipient_name,
      template_variables,
      scheduled_for,
      status
    )
    SELECT 
      p.email,
      p.name,
      jsonb_build_object(
        'eventType', 'order_confirmation',
        'orderId', NEW.id,
        'orderNumber', NEW.order_number,
        'totalAmount', NEW.total_amount
      ),
      NOW() + INTERVAL '30 seconds', -- Small delay for debouncing
      'pending'
    FROM profiles p
    WHERE p.id = NEW.user_id
    ON CONFLICT DO NOTHING; -- Prevent duplicates
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Attach new trigger
CREATE TRIGGER queue_order_emails_trigger
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION queue_order_emails();

-- ============================================
-- DEDUPLICATION: Prevent duplicate order emails
-- ============================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_queue_order_dedup 
ON email_queue ((template_variables->>'orderId'))
WHERE template_variables->>'eventType' = 'order_confirmation'
  AND status IN ('pending', 'processing');

-- ============================================
-- BIRTHDAY EMAILS: Use SQL cron (no edge function needed)
-- ============================================

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule birthday emails to run daily at 9 AM UTC
SELECT cron.schedule(
  'queue-birthday-emails',
  '0 9 * * *', -- 9 AM UTC daily
  $$
  INSERT INTO public.email_queue (
    recipient_email,
    recipient_name,
    template_variables,
    scheduled_for,
    status
  )
  SELECT 
    p.email,
    p.name,
    jsonb_build_object(
      'eventType', 
      CASE 
        WHEN EXISTS (
          SELECT 1 FROM auto_gifting_rules agr
          WHERE agr.user_id != p.id 
            AND agr.recipient_id = p.id
            AND agr.is_active = true
        ) THEN 'birthday_connection_with_autogift'
        WHEN EXISTS (
          SELECT 1 FROM user_connections uc
          WHERE (uc.user_id = p.id OR uc.connected_user_id = p.id)
            AND uc.status = 'accepted'
        ) THEN 'birthday_connection_no_autogift'
        ELSE 'birthday_reminder_curated'
      END,
      'userId', p.id,
      'userName', p.name,
      'birthDate', p.dob
    ),
    NOW() + INTERVAL '5 minutes',
    'pending'
  FROM profiles p
  WHERE EXTRACT(MONTH FROM p.dob) = EXTRACT(MONTH FROM CURRENT_DATE + INTERVAL '7 days')
    AND EXTRACT(DAY FROM p.dob) = EXTRACT(DAY FROM CURRENT_DATE + INTERVAL '7 days')
    AND p.email IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM birthday_email_tracking bet
      WHERE bet.user_id = p.id 
        AND bet.birthday_year = EXTRACT(YEAR FROM CURRENT_DATE)
    )
  ON CONFLICT DO NOTHING;
  $$
);