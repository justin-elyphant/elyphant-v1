-- Phase 3A: Post-Purchase Follow-up Trigger
-- This trigger queues a post-purchase follow-up email when an order is delivered

-- Function to queue post-purchase follow-up email
CREATE OR REPLACE FUNCTION queue_post_purchase_followup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
  user_first_name text;
  template_uuid uuid;
  product_names text;
  followup_days integer := 3; -- Send follow-up 3 days after delivery
BEGIN
  -- Only proceed if order status changed to 'delivered'
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    
    -- Get user email and name
    SELECT email, first_name INTO user_email, user_first_name
    FROM profiles
    WHERE id = NEW.user_id;
    
    -- Skip if no email found
    IF user_email IS NULL THEN
      RETURN NEW;
    END IF;
    
    -- Get active post-purchase follow-up template
    SELECT id INTO template_uuid
    FROM email_templates
    WHERE template_type = 'post_purchase_followup'
    AND is_active = true
    LIMIT 1;
    
    -- Skip if no template found
    IF template_uuid IS NULL THEN
      RAISE WARNING 'No active post_purchase_followup template found';
      RETURN NEW;
    END IF;
    
    -- Extract product names from order items
    SELECT string_agg(item->>'title', ', ')
    INTO product_names
    FROM jsonb_array_elements(NEW.items) AS item;
    
    -- Queue the follow-up email (scheduled for X days after delivery)
    INSERT INTO email_queue (
      template_id,
      recipient_email,
      recipient_name,
      template_variables,
      scheduled_for,
      status
    ) VALUES (
      template_uuid,
      user_email,
      COALESCE(user_first_name, 'Valued Customer'),
      jsonb_build_object(
        'first_name', COALESCE(user_first_name, 'Valued Customer'),
        'order_number', NEW.order_number,
        'product_names', COALESCE(product_names, 'your items'),
        'feedback_url', 'https://dmkxtkvlispxeqfzlczr.supabase.co/feedback?order=' || NEW.id,
        'support_url', 'https://dmkxtkvlispxeqfzlczr.supabase.co/support'
      ),
      NOW() + (followup_days || ' days')::interval,
      'pending'
    );
    
    RAISE LOG 'Queued post-purchase follow-up email for order % (user: %)', NEW.order_number, user_email;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on orders table
DROP TRIGGER IF EXISTS trigger_post_purchase_followup ON orders;
CREATE TRIGGER trigger_post_purchase_followup
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION queue_post_purchase_followup();

-- Add helpful comment
COMMENT ON FUNCTION queue_post_purchase_followup() IS 'Automatically queues post-purchase follow-up emails when orders are marked as delivered';