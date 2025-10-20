-- Update queue_post_purchase_followup to use correct column name product_name
CREATE OR REPLACE FUNCTION public.queue_post_purchase_followup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_email text;
  user_first_name text;
  template_uuid uuid;
  product_names text;
  followup_days integer := 3;
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

    -- Extract product names from order_items table (correct column product_name)
    SELECT string_agg(oi.product_name, ', ')
      INTO product_names
    FROM order_items oi
    WHERE oi.order_id = NEW.id;

    -- If order_items is empty, try cart_data as fallback
    IF product_names IS NULL AND NEW.cart_data IS NOT NULL THEN
      SELECT string_agg(item->>'title', ', ')
        INTO product_names
      FROM jsonb_array_elements(NEW.cart_data->'items') AS item;
    END IF;

    -- Queue the follow-up email
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
        'order_id', NEW.id
      ),
      NOW() + (followup_days || ' days')::interval,
      'pending'
    );

    -- Mark that follow-up email has been queued
    NEW.followup_email_sent := true;

  END IF;

  RETURN NEW;
END;
$function$;