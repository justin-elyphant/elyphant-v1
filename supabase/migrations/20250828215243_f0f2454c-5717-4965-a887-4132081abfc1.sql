UPDATE public.automated_gift_executions 
SET status = 'processing', 
    error_details = NULL,
    updated_at = NOW()
WHERE id = 'c60f3ea8-c1fd-4842-9d56-5f7b2035bdf3';