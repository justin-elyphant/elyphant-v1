-- Enable pg_trgm extension first for trigram search support
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add basic indexes for improved search performance
CREATE INDEX IF NOT EXISTS idx_profiles_first_name ON public.profiles(first_name);
CREATE INDEX IF NOT EXISTS idx_profiles_last_name ON public.profiles(last_name);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_name ON public.profiles(name);

-- Add composite indexes for name combinations
CREATE INDEX IF NOT EXISTS idx_profiles_first_last_name ON public.profiles(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_profiles_last_first_name ON public.profiles(last_name, first_name);

-- Add text search indexes using trigram after extension is enabled
CREATE INDEX IF NOT EXISTS idx_profiles_first_name_trgm ON public.profiles USING gin(first_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_last_name_trgm ON public.profiles USING gin(last_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm ON public.profiles USING gin(username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_name_trgm ON public.profiles USING gin(name gin_trgm_ops);

-- Add partial indexes for specific search patterns
CREATE INDEX IF NOT EXISTS idx_profiles_email_domain ON public.profiles(split_part(email, '@', 2)) WHERE email IS NOT NULL;