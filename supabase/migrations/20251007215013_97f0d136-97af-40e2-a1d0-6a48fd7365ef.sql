-- Drop overloaded RPC functions and fingerprint table
DROP FUNCTION IF EXISTS public.complete_order_processing(uuid, text, text, text);
DROP FUNCTION IF EXISTS public.complete_order_processing(uuid, text, text);
DROP FUNCTION IF EXISTS public.check_request_fingerprint(text, uuid, uuid);
DROP TABLE IF EXISTS public.order_request_fingerprints CASCADE;