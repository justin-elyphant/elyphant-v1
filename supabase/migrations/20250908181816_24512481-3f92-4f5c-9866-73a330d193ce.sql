-- Add column to track auto-created holiday events
ALTER TABLE public.user_special_dates 
ADD COLUMN created_by_auto_gifting boolean DEFAULT false;

-- Create index for efficient cleanup queries
CREATE INDEX idx_user_special_dates_auto_created 
ON public.user_special_dates (user_id, date_type, created_by_auto_gifting) 
WHERE created_by_auto_gifting = true;