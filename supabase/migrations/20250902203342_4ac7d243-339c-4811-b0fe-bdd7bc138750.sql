-- Update the order record with the zinc_order_id from the successful Zinc submission
UPDATE public.orders 
SET zinc_order_id = 'c0fcd8f9e5f37fe8b3eb6a3a636efb50',
    zinc_status = 'submitted',
    updated_at = now()
WHERE id = '16cb8901-58ba-4f7d-9116-3c76ba7e19b7';

-- Clear the misleading error message from the execution since the order actually succeeded
UPDATE public.automated_gift_executions 
SET error_message = null,
    updated_at = now()
WHERE id = 'c60f3ea8-c1fd-4842-9d56-5f7b2035bdf3';