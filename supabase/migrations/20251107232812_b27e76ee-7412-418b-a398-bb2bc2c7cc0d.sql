-- Update get_upcoming_auto_gift_events to support user filtering for testing
CREATE OR REPLACE FUNCTION get_upcoming_auto_gift_events(
  days_ahead INTEGER DEFAULT 7,
  user_filter UUID DEFAULT NULL
)
RETURNS TABLE (
  rule_id UUID,
  event_id UUID,
  user_id UUID,
  event_date DATE,
  event_type TEXT,
  date_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    agr.id as rule_id,
    usd.id as event_id,
    agr.user_id,
    usd.date as event_date,
    usd.date_type as event_type,
    agr.date_type
  FROM auto_gifting_rules agr
  JOIN user_special_dates usd ON (
    (agr.event_id = usd.id) OR 
    (agr.date_type = usd.date_type AND agr.recipient_id = usd.user_id)
  )
  WHERE agr.is_active = true
    AND usd.date BETWEEN CURRENT_DATE AND (CURRENT_DATE + days_ahead)
    AND (user_filter IS NULL OR agr.user_id = user_filter);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;