-- Add metadata JSONB column to profiles table for flexible user data storage
-- This enables storing user sizes, theme preferences, and feature flags without schema changes

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_profiles_metadata ON profiles USING gin(metadata);

-- Add helpful comment for developers
COMMENT ON COLUMN profiles.metadata IS 'Flexible storage for user preferences: sizes (tops, bottoms, shoes, ring, fit_preference), theme settings, and feature flags';

-- Example data structure:
-- {
--   "sizes": {
--     "tops": "M",
--     "bottoms": "32x32",
--     "shoes": "US 10",
--     "ring": "9",
--     "fit_preference": "relaxed"
--   },
--   "theme": "light",
--   "feature_flags": {}
-- }