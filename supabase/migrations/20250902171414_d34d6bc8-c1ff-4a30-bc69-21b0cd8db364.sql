-- Reset the execution status to pending_approval so the user can retry with the corrected product data
UPDATE automated_gift_executions 
SET status = 'pending_approval',
    error_message = 'Product data format corrected. Ready for retry.',
    updated_at = now()
WHERE id = 'c60f3ea8-c1fd-4842-9d56-5f7b2035bdf3';