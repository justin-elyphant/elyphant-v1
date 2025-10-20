-- Add city and state columns to profiles table for location privacy
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text;

-- Add index for location-based searches
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(state, city) 
WHERE state IS NOT NULL AND city IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.city IS 'User city for connection search display (replaces email for privacy)';
COMMENT ON COLUMN public.profiles.state IS 'User state for connection search display (replaces email for privacy)';