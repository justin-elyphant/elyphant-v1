
-- Fix trigger function with correct column names for all tables
CREATE OR REPLACE FUNCTION public.track_wishlist_purchase_and_notify()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_wishlist_owner_id UUID;
  v_wishlist_owner_email TEXT;
  v_purchaser_name TEXT;
  v_product_title TEXT;
  v_product_image TEXT;
  v_wishlist_name TEXT;
BEGIN
  -- Get wishlist owner details (wishlists has 'title' column, not 'name')
  SELECT 
    w.user_id,
    w.title
  INTO 
    v_wishlist_owner_id,
    v_wishlist_name
  FROM wishlists w
  WHERE w.id = NEW.wishlist_id;

  -- Only proceed if we found the wishlist owner
  IF v_wishlist_owner_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get owner's email from profiles (profiles.id = user_id, has 'email' column)
  SELECT email INTO v_wishlist_owner_email
  FROM profiles
  WHERE id = v_wishlist_owner_id;

  -- Get purchaser name if available (profiles has 'name' column, keyed by 'id')
  IF NEW.purchaser_user_id IS NOT NULL THEN
    SELECT 
      COALESCE(name, email)
    INTO v_purchaser_name
    FROM profiles
    WHERE id = NEW.purchaser_user_id;
  END IF;

  -- Use provided name if no user found
  IF v_purchaser_name IS NULL THEN
    v_purchaser_name := COALESCE(NEW.purchaser_name, 'Someone');
  END IF;

  -- Get product details
  SELECT 
    COALESCE(title, name),
    image_url
  INTO 
    v_product_title,
    v_product_image
  FROM wishlist_items
  WHERE id = NEW.item_id;

  -- Queue the email notification (email_queue uses 'template_variables' not 'event_data')
  INSERT INTO email_queue (
    event_type,
    recipient_email,
    template_variables,
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
    NOW()
  );

  RETURN NEW;
END;
$function$;

-- Now insert the purchase record for Justin's iPhone case
INSERT INTO public.wishlist_item_purchases (
  wishlist_id,
  item_id,
  product_id,
  purchaser_user_id,
  is_anonymous,
  order_id,
  quantity,
  price_paid
) VALUES (
  'df35823f-84f3-4804-a816-21b6e8cb1b26',
  '5996f01d-8e79-4a8a-bd2d-ac44b1a2ed64',
  'B0FGCJNN33',
  'f5c6fbb5-f2f2-4430-b679-39ec117e3596',
  false,
  '7cc03e10-0c00-458a-860a-e937a1850d8f',
  1,
  42.74
)
ON CONFLICT DO NOTHING;
