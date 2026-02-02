-- Reset Charles's execution to allow retry (was approved but no order created)
UPDATE automated_gift_executions 
SET status = 'pending_approval', updated_at = NOW() 
WHERE id = '74ccdab5-06f7-42e5-9ef2-fa347bbee23b';

-- Reset the associated approval token
UPDATE email_approval_tokens 
SET approved_at = NULL, approved_via = NULL, updated_at = NOW() 
WHERE execution_id = '74ccdab5-06f7-42e5-9ef2-fa347bbee23b';