-- Add webhook tracking columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS webhook_received_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_polling_check_at TIMESTAMPTZ;

-- Clean up duplicate webhook logs before adding constraint
DELETE FROM webhook_delivery_log a USING (
  SELECT MIN(ctid) as ctid, event_id, event_type
  FROM webhook_delivery_log 
  GROUP BY event_id, event_type
  HAVING COUNT(*) > 1
) b
WHERE a.event_id = b.event_id 
  AND a.event_type = b.event_type 
  AND a.ctid <> b.ctid;

-- Add unique constraint to prevent duplicate webhook processing
ALTER TABLE webhook_delivery_log
ADD CONSTRAINT unique_webhook_event 
UNIQUE (event_id, event_type);

-- Add index for efficient webhook-timeout queries
CREATE INDEX IF NOT EXISTS idx_orders_webhook_timeout 
ON orders(zinc_request_id, zinc_order_id, created_at) 
WHERE zinc_request_id IS NOT NULL AND zinc_order_id IS NULL;

COMMENT ON COLUMN orders.webhook_received_at IS 'Timestamp when Zinc webhook was received (NULL if caught by polling)';
COMMENT ON COLUMN orders.last_polling_check_at IS 'Last time order-monitor-v2 checked this order status';

-- Trigger function to alert on stuck orders
CREATE OR REPLACE FUNCTION alert_stuck_zinc_orders()
RETURNS TRIGGER AS $$
BEGIN
  -- If order has zinc_request_id for >30 min without zinc_order_id
  IF NEW.zinc_request_id IS NOT NULL 
     AND NEW.zinc_order_id IS NULL 
     AND NEW.created_at < NOW() - INTERVAL '30 minutes'
     AND (OLD.last_polling_check_at IS NULL OR OLD.last_polling_check_at <> NEW.last_polling_check_at) THEN
    
    -- Insert admin alert
    INSERT INTO admin_alerts (
      alert_type,
      severity,
      message,
      order_id,
      metadata
    ) VALUES (
      'stuck_zinc_order',
      'warning',
      'Order stuck without zinc_order_id for 30+ minutes',
      NEW.id,
      jsonb_build_object(
        'order_number', NEW.order_number,
        'zinc_request_id', NEW.zinc_request_id,
        'minutes_stuck', EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) / 60,
        'webhook_received_at', NEW.webhook_received_at
      )
    );
    
    RAISE NOTICE 'Admin alert created for stuck order: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (only fires on updates)
DROP TRIGGER IF EXISTS check_stuck_orders ON orders;
CREATE TRIGGER check_stuck_orders
AFTER UPDATE OF last_polling_check_at ON orders
FOR EACH ROW
EXECUTE FUNCTION alert_stuck_zinc_orders();