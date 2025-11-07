-- Update the track_wishlist_purchase_and_notify function to include wishlist_owner_id
CREATE OR REPLACE FUNCTION track_wishlist_purchase_and_notify()
RETURNS TRIGGER AS $$
DECLARE
  v_wishlist_owner_id UUID;
  v_wishlist_owner_email TEXT;
  v_purchaser_name TEXT;
  v_product_title TEXT;
  v_product_image TEXT;
  v_wishlist_name TEXT;
BEGIN
  -- Get wishlist owner details
  SELECT 
    w.user_id,
    w.name
  INTO 
    v_wishlist_owner_id,
    v_wishlist_name
  FROM wishlists w
  WHERE w.id = NEW.wishlist_id;

  -- Only proceed if we found the wishlist owner
  IF v_wishlist_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get owner's email from profiles
  SELECT email INTO v_wishlist_owner_email
  FROM auth.users
  WHERE id = v_wishlist_owner_id;

  -- Get purchaser name if available
  IF NEW.purchaser_user_id IS NOT NULL THEN
    SELECT 
      COALESCE(display_name, full_name, email)
    INTO v_purchaser_name
    FROM profiles
    WHERE user_id = NEW.purchaser_user_id;
  END IF;

  -- Use provided name if no user found
  IF v_purchaser_name IS NULL THEN
    v_purchaser_name := COALESCE(NEW.purchaser_name, 'Someone');
  END IF;

  -- Get product details
  SELECT 
    title,
    image_url
  INTO 
    v_product_title,
    v_product_image
  FROM wishlist_items
  WHERE id = NEW.item_id;

  -- Queue the email notification with wishlist_owner_id included
  INSERT INTO email_queue (
    event_type,
    recipient_email,
    event_data,
    status,
    scheduled_for
  ) VALUES (
    'wishlist_item_purchased',
    v_wishlist_owner_email,
    jsonb_build_object(
      'wishlist_owner_id', v_wishlist_owner_id,
      'purchaser_name', v_purchaser_name,
      'purchaser_user_id', NEW.purchaser_user_id,
      'is_anonymous', NEW.is_anonymous,
      'product_title', v_product_title,
      'product_image_url', v_product_image,
      'wishlist_name', v_wishlist_name,
      'wishlist_id', NEW.wishlist_id,
      'purchase_date', NEW.purchased_at,
      'quantity', NEW.quantity,
      'price_paid', NEW.price_paid
    ),
    'pending',
    NOW() -- Send immediately
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;