-- Clean up the unnecessary approval token that was created
DELETE FROM public.email_approval_tokens 
WHERE execution_id = 'c60f3ea8-c1fd-4842-9d56-5f7b2035bdf3';