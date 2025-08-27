-- Update the current execution to processing status to continue the auto-gift workflow
UPDATE public.automated_gift_executions 
SET 
  status = 'processing',
  updated_at = now()
WHERE id = 'c60f3ea8-c1fd-4842-9d56-5f7b2035bdf3';