-- Make Dua's "Test list 8.19" wishlist public so it can be shared
UPDATE wishlists 
SET is_public = true 
WHERE title ILIKE '%test list%' 
  AND user_id = '54087479-29f1-4f7f-afd0-cbdc31d6fb91';