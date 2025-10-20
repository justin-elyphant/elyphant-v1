-- Phase 4: Add Behavioral Flags & Analytics
-- Add behavioral tracking columns to profiles table

-- Step 1: Add behavioral flag columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS has_purchased boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_given_gifts boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_wishlist boolean DEFAULT false;

-- Step 2: Backfill behavioral flags from existing data

-- Mark users who have completed purchases
UPDATE profiles 
SET has_purchased = true
WHERE id IN (
  SELECT DISTINCT user_id 
  FROM orders 
  WHERE status IN ('completed', 'delivered')
);

-- Mark users who have given gifts (orders marked as gifts)
UPDATE profiles 
SET has_given_gifts = true
WHERE id IN (
  SELECT DISTINCT user_id 
  FROM orders 
  WHERE is_gift = true OR gift_message IS NOT NULL
);

-- Mark users who have wishlist items
UPDATE profiles 
SET has_wishlist = true
WHERE id IN (
  SELECT DISTINCT user_id 
  FROM wishlists
  WHERE EXISTS (
    SELECT 1 FROM wishlist_items 
    WHERE wishlist_items.wishlist_id = wishlists.id
  )
);

-- Step 3: Create index for performance on behavioral flags
CREATE INDEX IF NOT EXISTS idx_profiles_behavioral_flags 
ON profiles(has_purchased, has_given_gifts, has_wishlist)
WHERE has_purchased = true OR has_given_gifts = true OR has_wishlist = true;

-- Add comments for documentation
COMMENT ON COLUMN profiles.has_purchased IS 'Indicates if user has completed at least one purchase';
COMMENT ON COLUMN profiles.has_given_gifts IS 'Indicates if user has sent at least one gift';
COMMENT ON COLUMN profiles.has_wishlist IS 'Indicates if user has any items in their wishlist';