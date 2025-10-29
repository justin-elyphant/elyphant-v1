-- Grant execute permissions on the RPC to web roles
GRANT EXECUTE ON FUNCTION public.get_public_profile_by_identifier(text) TO anon, authenticated;