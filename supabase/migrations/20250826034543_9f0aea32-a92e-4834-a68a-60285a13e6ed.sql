-- Add new status values for address handling in auto-gift executions
ALTER TABLE automated_gift_executions 
ALTER COLUMN status TYPE text;

-- Update the existing type to include new address-related statuses
COMMENT ON COLUMN automated_gift_executions.status IS 'Execution status: pending, processing, completed, failed, cancelled, address_required, pending_address';

-- Add address_metadata field to store resolved address information
ALTER TABLE automated_gift_executions 
ADD COLUMN IF NOT EXISTS address_metadata jsonb DEFAULT '{}';

COMMENT ON COLUMN automated_gift_executions.address_metadata IS 'Stores resolved address information including source, verification status, and confirmation needs';