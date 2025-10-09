-- One-time data fix: Reconcile orphaned payment and cleanup duplicates

-- 1. Link the orphaned payment intent to the correct order
UPDATE orders 
SET 
  stripe_payment_intent_id = 'pi_3SGKfWJPK0Zkd1vc0gLkCKmA',
  payment_status = 'succeeded',
  status = 'payment_confirmed',
  updated_at = now()
WHERE id = '2c354a64-61cd-4580-b0d8-6952328208a2';

-- 2. Delete duplicate orders that were created with incorrect payment intents
DELETE FROM orders 
WHERE id IN (
  '00f80a3f-8af7-4cba-9840-6ca2575a877b',  -- ORD-20251009-6878
  '508c9747-ef8c-4045-aea5-31d4e79d2100'   -- ORD-20251009-4359
);