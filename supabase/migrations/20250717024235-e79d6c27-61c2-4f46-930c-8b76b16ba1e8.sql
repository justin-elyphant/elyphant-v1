-- Add archived_at column to user_special_dates table
ALTER TABLE public.user_special_dates 
ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for better performance when filtering archived events
CREATE INDEX idx_user_special_dates_archived_at ON public.user_special_dates(archived_at) WHERE archived_at IS NOT NULL;