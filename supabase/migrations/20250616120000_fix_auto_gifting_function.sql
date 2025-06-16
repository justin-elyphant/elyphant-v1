
-- First, let's ensure we have proper relationships between events and auto-gifting rules
-- Add missing columns to auto_gifting_rules if they don't exist
ALTER TABLE auto_gifting_rules 
ADD COLUMN IF NOT EXISTS auto_approve_gifts boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS gift_message text,
ADD COLUMN IF NOT EXISTS created_from_event_id uuid REFERENCES user_special_dates(id);

-- Create a table for tracking automated gift executions
CREATE TABLE IF NOT EXISTS automated_gift_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid REFERENCES auto_gifting_rules(id) ON DELETE CASCADE,
  event_id uuid REFERENCES user_special_dates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  execution_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  selected_products jsonb,
  total_amount numeric,
  order_id uuid REFERENCES orders(id),
  error_message text,
  retry_count integer DEFAULT 0,
  next_retry_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_automated_gift_executions_execution_date ON automated_gift_executions(execution_date);
CREATE INDEX IF NOT EXISTS idx_automated_gift_executions_status ON automated_gift_executions(status);
CREATE INDEX IF NOT EXISTS idx_automated_gift_executions_user_id ON automated_gift_executions(user_id);

-- Create a function to check for upcoming auto-gift events (fixed type issue)
CREATE OR REPLACE FUNCTION get_upcoming_auto_gift_events(days_ahead integer DEFAULT 7)
RETURNS TABLE (
  event_id uuid,
  rule_id uuid,
  user_id uuid,
  event_date date,
  event_type text,
  recipient_id uuid,
  budget_limit numeric,
  notification_days integer[]
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    usd.id as event_id,
    agr.id as rule_id,
    usd.user_id,
    usd.date::date as event_date,
    usd.date_type as event_type,
    agr.recipient_id,
    agr.budget_limit,
    COALESCE(
      (agr.notification_preferences->>'days_before')::integer[],
      ARRAY[7, 3, 1]
    ) as notification_days
  FROM user_special_dates usd
  JOIN auto_gifting_rules agr ON (
    agr.user_id = usd.user_id 
    AND agr.date_type = usd.date_type
    AND agr.is_active = true
  )
  WHERE usd.date::date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '1 day' * days_ahead)
  AND NOT EXISTS (
    SELECT 1 FROM automated_gift_executions age 
    WHERE age.event_id = usd.id 
    AND age.rule_id = agr.id 
    AND age.execution_date = usd.date::date
    AND age.status IN ('completed', 'processing')
  );
$$;

-- Enable RLS on the new table
ALTER TABLE automated_gift_executions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own gift executions"
  ON automated_gift_executions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gift executions"
  ON automated_gift_executions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gift executions"
  ON automated_gift_executions FOR UPDATE
  USING (auth.uid() = user_id);
