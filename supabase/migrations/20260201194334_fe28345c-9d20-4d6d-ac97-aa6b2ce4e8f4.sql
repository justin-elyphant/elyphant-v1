-- Fix the incorrectly saved recipient_id in Charles's recurring gift rule
-- Charles (f5c6fbb5-f2f2-4430-b679-39ec117e3596) set up a gift for Justin (a3a6e0fb-4b2c-4627-a675-a08480d60f89)
-- but it was incorrectly saved with recipient_id pointing to Charles himself

UPDATE auto_gifting_rules 
SET recipient_id = 'a3a6e0fb-4b2c-4627-a675-a08480d60f89',
    updated_at = now()
WHERE id = 'b37b3dc8-ac3a-4549-a978-399ec6ae8ad5'
  AND user_id = 'f5c6fbb5-f2f2-4430-b679-39ec117e3596'
  AND recipient_id = 'f5c6fbb5-f2f2-4430-b679-39ec117e3596';  -- Safety check: only update if still pointing to wrong user