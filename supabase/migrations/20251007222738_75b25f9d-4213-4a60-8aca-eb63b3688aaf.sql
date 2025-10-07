-- Drop the old version of start_order_processing that has the wrong signature
DROP FUNCTION IF EXISTS public.start_order_processing(uuid, uuid);

-- The new version (with single uuid parameter) is already in place from the previous migration