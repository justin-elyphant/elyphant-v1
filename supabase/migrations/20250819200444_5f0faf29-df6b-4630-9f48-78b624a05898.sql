-- Make the correct "Test wishlist_8.19" public (it has the full timestamp in the title)
UPDATE wishlists 
SET is_public = true 
WHERE title = 'Test wishlist_8.19 @ 12:45 PM PST' 
  AND user_id = '54087479-29f1-4f7f-afd0-cbdc31d6fb91';