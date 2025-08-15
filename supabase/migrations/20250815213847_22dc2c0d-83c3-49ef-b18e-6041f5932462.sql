-- Add database indexes for improved search performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_first_name_gin ON public.profiles USING gin(first_name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_last_name_gin ON public.profiles USING gin(last_name gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_username_gin ON public.profiles USING gin(username gin_trgm_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_name_gin ON public.profiles USING gin(name gin_trgm_ops);

-- Add composite indexes for name combinations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_first_last_name ON public.profiles(first_name, last_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_last_first_name ON public.profiles(last_name, first_name);

-- Add partial indexes for specific search patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_email_domain ON public.profiles(split_part(email, '@', 2)) WHERE email IS NOT NULL;

-- Enable pg_trgm extension for better text search if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;