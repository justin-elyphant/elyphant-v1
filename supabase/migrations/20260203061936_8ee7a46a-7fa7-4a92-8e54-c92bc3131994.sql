-- Restore order status that was incorrectly marked as failed
UPDATE orders 
SET status = 'processing',
    notes = NULL
WHERE id = 'db697d76-dd5e-4ab0-9389-b91996b60ee9';