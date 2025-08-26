-- Make event_id nullable in automated_gift_executions to support "just_because" events with synthetic UUIDs
ALTER TABLE public.automated_gift_executions 
ALTER COLUMN event_id DROP NOT NULL;

-- Add a comment to explain the nullable event_id usage
COMMENT ON COLUMN public.automated_gift_executions.event_id IS 'Event ID from user_special_dates for calendar-based events, or NULL for synthetic events like just_because gifts';