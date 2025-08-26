-- Add scheduled_date column to auto_gifting_rules table
ALTER TABLE public.auto_gifting_rules 
ADD COLUMN scheduled_date DATE;

-- Add comment for documentation
COMMENT ON COLUMN public.auto_gifting_rules.scheduled_date IS 'Optional specific date for scheduled gifts (vs recurring event-based gifts)';