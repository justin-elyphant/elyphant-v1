-- Fix post-purchase follow-up trigger to include eventType in template_variables
CREATE OR REPLACE FUNCTION queue_post_purchase_followup_email()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_first_name TEXT;
  product_list TEXT;
  feedback_url TEXT;
  support_url TEXT;
BEGIN
  -- Only proceed if order status changed to 'delivered'
  IF NEW.status = 'delivered' AND (OLD.status IS NULL OR OLD.status != 'delivered') THEN
    
    -- Get user email and name
    SELECT email, COALESCE(first_name, 'Valued Customer')
    INTO user_email, user_first_name
    FROM profiles
    WHERE id = NEW.user_id;
    
    -- Build product list from order items
    SELECT STRING_AGG(product_name, ', ')
    INTO product_list
    FROM order_items
    WHERE order_id = NEW.id;
    
    -- Build feedback and support URLs
    feedback_url := 'https://dmkxtkvlispxeqfzlczr.supabase.co/feedback?order=' || NEW.order_number;
    support_url := 'https://dmkxtkvlispxeqfzlczr.supabase.co/support';
    
    -- Queue the post-purchase follow-up email (scheduled for 3 days after delivery)
    INSERT INTO email_queue (
      recipient_email,
      recipient_name,
      template_variables,
      scheduled_send_time,
      priority
    ) VALUES (
      user_email,
      user_first_name,
      jsonb_build_object(
        'eventType', 'post_purchase_followup',
        'first_name', user_first_name,
        'order_number', NEW.order_number,
        'product_names', product_list,
        'feedback_url', feedback_url,
        'support_url', support_url
      ),
      NOW() + INTERVAL '3 days',
      'low'
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;