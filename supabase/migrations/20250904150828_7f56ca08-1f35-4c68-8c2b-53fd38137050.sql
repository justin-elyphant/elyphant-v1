-- Add retry-related columns to orders table for duplicate charge prevention
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS retry_reason TEXT;

-- Add helpful comments
COMMENT ON COLUMN public.orders.retry_count IS 'Number of retry attempts for failed orders';
COMMENT ON COLUMN public.orders.next_retry_at IS 'Scheduled time for next retry attempt';
COMMENT ON COLUMN public.orders.retry_reason IS 'Reason for retry (e.g. retryable_system, zma_overload)';

-- Create an index for efficient retry processing
CREATE INDEX IF NOT EXISTS idx_orders_retry_pending 
ON public.orders (status, next_retry_at) 
WHERE status = 'retry_pending';

-- Create an index for retry processing based on retry count and next retry time
CREATE INDEX IF NOT EXISTS idx_orders_retry_processing 
ON public.orders (next_retry_at, retry_count) 
WHERE status = 'retry_pending' AND retry_count < 3;