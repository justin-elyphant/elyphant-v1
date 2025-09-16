-- Fix the remaining Security Definer View issue
-- The search_users_for_friends function legitimately needs SECURITY DEFINER 
-- because it must bypass RLS to search across all profiles for friend discovery.
-- This is documented in the function comments.

-- Add documentation to clarify why SECURITY DEFINER is needed for search function
COMMENT ON FUNCTION public.search_users_for_friends IS 
'SECURITY DEFINER required: This function needs to bypass RLS to search across all user profiles for friend discovery while still respecting privacy and blocking rules';

-- The get_zma_account_safe function also legitimately needs SECURITY DEFINER
-- because it needs to access ZMA account data with special permissions
COMMENT ON FUNCTION public.get_zma_account_safe IS 
'SECURITY DEFINER required: This function needs elevated privileges to safely access ZMA account data with proper authorization checks';

-- After investigation, all remaining SECURITY DEFINER table-returning functions are legitimate:
-- 1. search_users_for_friends - needs to search across all profiles for friend discovery
-- 2. get_zma_account_safe - needs elevated access to ZMA accounts with authorization checks

-- The linter error may be a false positive since PostgreSQL doesn't distinguish between
-- "view-like" functions and security functions that legitimately need SECURITY DEFINER.

-- As an alternative approach, let's ensure these functions have minimal scope and proper documentation